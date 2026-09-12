"""Run the demo with: python3 server.py"""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os
import argparse
import re
import json
import urllib.request
import urllib.error
from urllib.parse import urlparse


class DemoHandler(SimpleHTTPRequestHandler):
    """Serve the explicitly selected teacher/student recordings, with seeking."""
    media_root = Path(__file__).resolve().parent.parent / '视频'
    student_root = Path('/Users/grace/Desktop/文件/视频/2024-9-10')
    files = [
        '教师全景_智慧医疗创新体验_周晋_20240910_132510.mp4',
        '教师全景_智慧医疗创新体验_周晋_20240910_142110.mp4',
        '教师全景_智慧医疗创新体验_周晋_20240910_151710.mp4',
    ]

    def do_POST(self):
        if urlparse(self.path).path != '/api/agent/chat':
            self.send_error(404)
            return
        api_key = os.environ.get('QWEN_API_KEY', '').strip()
        if not api_key:
            self.send_json(503, {'error': 'AI 服务尚未配置'})
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            payload = json.loads(self.rfile.read(length) or b'{}')
            question = str(payload.get('question', '')).strip()
            if not question:
                self.send_json(400, {'error': '请输入问题'})
                return
            context = json.dumps({
                'course': payload.get('course', '智慧医疗'),
                'skill': payload.get('skill'),
                'references': payload.get('references', [])[:10],
                'asr': payload.get('asr', {})
            }, ensure_ascii=False)
            upstream = urllib.request.Request(
                'https://narrows-gateway.test.seewo.com/v1/chat/completions',
                data=json.dumps({
                    'model': 'qwen3.7-flash',
                    'messages': [
                        {'role': 'system', 'content': '你是课堂教学评价助手。只依据提供的课堂报告、引用模块和转写回答；先给出有证据的判断，再给出具体建议。不要编造数据、原话或视频位置；证据不足时明确说明。回答简洁、专业。'},
                        {'role': 'user', 'content': f'课堂上下文：\n{context}\n\n用户问题：{question}'}
                    ],
                    'temperature': 0.3,
                    'stream': False
                }, ensure_ascii=False).encode('utf-8'),
                headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'}
            )
            with urllib.request.urlopen(upstream, timeout=45) as response:
                result = json.loads(response.read())
            content = result['choices'][0]['message']['content']
            self.send_json(200, {'content': content})
        except urllib.error.HTTPError as error:
            self.send_json(502, {'error': 'AI 服务暂时不可用', 'status': error.code})
        except (ValueError, KeyError, TimeoutError, urllib.error.URLError):
            self.send_json(502, {'error': 'AI 服务暂时不可用'})

    def send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_head(self):
        self.media_remaining = None
        request_path = urlparse(self.path).path
        if not request_path.startswith('/local-media/'):
            return super().send_head()
        match = re.fullmatch(r'/local-media/(student/)?([123])\.mp4', request_path)
        if not match:
            self.send_error(404)
            return None
        filename = self.files[int(match[2]) - 1]
        target = (self.student_root / filename.replace('教师全景_', '学生全景_', 1)
                  if match[1] else self.media_root / filename)
        if not target.is_file():
            self.send_error(404, 'Recording unavailable')
            return None
        size = target.stat().st_size
        start, end = 0, size - 1
        range_header = self.headers.get('Range')
        if range_header:
            bounds = re.fullmatch(r'bytes=(\d*)-(\d*)', range_header)
            if not bounds or not any(bounds.groups()):
                self.send_error(416)
                return None
            left, right = bounds.groups()
            if left:
                start = int(left)
                end = min(int(right), size - 1) if right else size - 1
            else:
                start = max(0, size - int(right))
            if start >= size or start > end:
                self.send_response(416)
                self.send_header('Content-Range', f'bytes */{size}')
                self.end_headers()
                return None
        source = target.open('rb')
        source.seek(start)
        self.media_remaining = end - start + 1
        self.send_response(206 if range_header else 200)
        self.send_header('Content-Type', 'video/mp4')
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Length', str(self.media_remaining))
        if range_header:
            self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.end_headers()
        return source

    def copyfile(self, source, outputfile):
        if self.media_remaining is None:
            return super().copyfile(source, outputfile)
        try:
            while self.media_remaining:
                block = source.read(min(1024 * 1024, self.media_remaining))
                if not block:
                    break
                outputfile.write(block)
                self.media_remaining -= len(block)
        except (BrokenPipeError, ConnectionResetError):
            pass

os.chdir(Path(__file__).parent)
parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=5178)
args = parser.parse_args()
server = ThreadingHTTPServer(("127.0.0.1", args.port), DemoHandler)
print(f"教评报告 DEMO → http://127.0.0.1:{args.port}", flush=True)
server.serve_forever()
