"""Run the demo with: python3 server.py"""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os
import argparse
import re
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
