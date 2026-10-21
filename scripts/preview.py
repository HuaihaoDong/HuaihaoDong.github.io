"""预览本站；独立图床沿用线上地址，服务器仅监听本机。"""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit

root = Path(__file__).resolve().parents[1]

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(root), **kwargs)
    def do_GET(self):
        if urlsplit(self.path).path.split('/')[1] in ('pics', 'pics2', 'pics3', 'pics4'):
            self.send_response(302)
            self.send_header('Location', 'https://www.donghuaihao.com' + self.path)
            self.end_headers()
        else:
            super().do_GET()

if __name__ == '__main__':
    print('Local preview: http://127.0.0.1:8765', flush=True)
    try:
        ThreadingHTTPServer(('127.0.0.1', 8765), Handler).serve_forever()
    except KeyboardInterrupt:
        pass
