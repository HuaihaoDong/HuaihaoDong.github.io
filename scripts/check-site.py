"""检查本地页面、JSON、锚点及资源；独立图床的 Pages 路径单独统计。"""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, parse_qs, unquote
import json
import re
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
errors = []
remote = set()
references = 0

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path, self.ids, self.refs = path, set(), []
        self.h1 = 0
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        identity = attrs.get('id')
        if identity:
            if identity in self.ids: errors.append(f'{self.path.name}: duplicate id {identity}')
            self.ids.add(identity)
        self.h1 += tag == 'h1'
        for key in ('src', 'href', 'data-full'):
            if attrs.get(key): self.refs.append(attrs[key])

pages = {}
for path in root.glob('*.html'):
    page = Page(path)
    page.feed(path.read_text(encoding='utf-8'))
    pages[path.name] = page
    if not page.h1 and path.name != 'detail.html': errors.append(f'{path.name}: missing h1')

data = {}
for path in root.glob('*.json'):
    try: data[path.name] = json.loads(path.read_text(encoding='utf-8'))
    except ValueError as error: errors.append(f'{path.name}: {error}')

def check_ref(ref, source):
    global references
    url = urlsplit(ref)
    if url.scheme or url.netloc: return
    path = unquote(url.path)
    references += 1
    if re.match(r'^/?pics[234]?/', path):
        remote.add(path)
        return
    if path and not (root / path.lstrip('/')).is_file():
        errors.append(f'{source}: missing {path}')
        return
    if url.fragment and (path or source) in pages:
        page = pages[path or source]
        if url.fragment not in page.ids: errors.append(f'{source}: missing anchor {ref}')
    if path == 'detail.html':
        params = parse_qs(url.query)
        filename = params.get('data', ['activities.json'])[0]
        identity = params.get('id', [''])[0]
        if not any(item.get('id') == identity for item in data.get(filename, [])):
            errors.append(f'{source}: missing activity {ref}')

for name, page in pages.items():
    for ref in page.refs: check_ref(ref, name)

def walk(value, source):
    if isinstance(value, dict):
        for item in value.values(): walk(item, source)
    elif isinstance(value, list):
        for item in value: walk(item, source)
    elif isinstance(value, str) and re.search(r'\.(?:webp|png|jpe?g|mp4)$', value, re.I):
        check_ref(value, source)

for name, value in data.items():
    walk(value, name)
    if isinstance(value, list) and value and isinstance(value[0], dict) and 'id' in value[0]:
        identities = [item['id'] for item in value]
        if len(set(identities)) != len(identities): errors.append(f'{name}: duplicate activity id')

# Node 只解析语法，不执行网页脚本。
syntax = subprocess.run(['node', '-e', "const fs=require('node:fs'),vm=require('node:vm');let n=0;for(const file of fs.readdirSync('.')){if(file.endsWith('.js')){new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});n++;}if(file.endsWith('.html')){for(const m of fs.readFileSync(file,'utf8').matchAll(/<script\\b([^>]*)>([\\s\\S]*?)<\\/script>/gi)){if(!/\\bsrc=/.test(m[1])){new vm.Script(m[2],{filename:file});n++;}}}}console.log('JavaScript syntax OK:',n,'scripts');"], cwd=root, text=True, capture_output=True)
if syntax.returncode: errors.append(syntax.stderr)
print(syntax.stdout.strip())
print(f'{len(pages)} pages; {len(data)} JSON files; {references} local references; {len(remote)} image references hosted by separate Pages repositories.')
for error in errors: print('ERROR:', error)
print('PASS' if not errors else 'FAIL')
sys.exit(bool(errors))
