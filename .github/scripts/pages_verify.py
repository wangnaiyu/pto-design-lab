#!/usr/bin/env python3
"""Target-owned static collection and byte acceptance. Never execute site code."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import time
import urllib.request
from urllib.parse import quote

SITE = 'https://wangnaiyu.github.io/pto-design-lab/'
CONTROLS = {'.github/workflows/pages.yml', '.github/scripts/pages_verify.py'}


def require(value, rule):
    if not value: raise ValueError(rule)


def sha(data): return hashlib.sha256(data).hexdigest()


def load(root):
    root = Path(root)
    metadata = root / '_release.json'
    require(not metadata.is_symlink() and metadata.stat().st_size <= 4 * 1024 * 1024, 'MANIFEST_LIMIT')
    m = json.loads(metadata.read_bytes())
    require(set(m) == {'version', 'site_digest', 'files', 'controls'} and type(m['version']) is int
            and m['version'] == 1 and re.fullmatch('[a-f0-9]{64}', m['site_digest']), 'MANIFEST_SCHEMA')
    require(0 < len(m['files']) <= 10000 and set(m['controls']) == CONTROLS, 'FILE_SET')
    expected = set(m['files']) | CONTROLS | {'_release.json'}
    # Read immutable checkout objects; .git is never included in the site artifact.
    tracked = subprocess.check_output(['git', '-C', str(root), 'ls-tree', '-r', '-z', 'HEAD'])
    entries = {}
    for row in tracked.split(b'\0'):
        if row:
            info, name = row.split(b'\t'); mode, kind, _ = info.split()
            require(mode == b'100644' and kind == b'blob', 'FILE_MODE')
            entries[name.decode()] = mode
    require(set(entries) == expected, 'FILE_SET')
    files = {}; total = 0
    for name in sorted(expected):
        require(not name.startswith('/') and '\\' not in name and all(p not in {'', '.', '..'} for p in name.split('/')), 'PATH')
        path = root / name
        require(not any(p.is_symlink() for p in [path, *path.parents]) and path.is_file(), 'FILE_MODE')
        require(path.stat().st_size <= 16777216, 'FILE_LIMIT')
        data = path.read_bytes(); total += len(data); require(total <= 134217728, 'TREE_LIMIT')
        if name in m['files']:
            require(not any(p.startswith('.') for p in name.split('/')) or name == '.nojekyll', 'STATIC_PATH')
            require(name not in {'CNAME', '_release.json'}, 'FIXED_SITE')
            require(m['files'][name] == {'sha256': sha(data), 'size': len(data)}, 'FILE_HASH')
            files[name] = data
        elif name in CONTROLS: require(sha(data) == m['controls'][name], 'CONTROL_HASH')
    require({'index.html', '_catalog.json', '.nojekyll', 'README.md', 'LICENSE'} <= set(files), 'SITE_ROOT')
    return files


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl): return None


def fetch(url, size):
    request = urllib.request.Request(url, headers={'Cache-Control': 'no-cache', 'Accept-Encoding': 'identity'})
    with urllib.request.build_opener(NoRedirect()).open(request, timeout=15) as response:
        require(response.status == 200, 'HTTP_STATUS')
        return response.read(size + 1)


def verify(files, get=fetch, clock=time.monotonic):
    start = clock()
    routes = [(p, p) for p in sorted(files)]
    routes += [(p[:-10], p) for p in sorted(files) if p == 'index.html' or p.endswith('/index.html')]
    for route, name in routes:
        require(clock() - start < 180, 'DEADLINE')
        require(get(SITE + quote(route, safe='/'), len(files[name])) == files[name], 'CONTENT_DRIFT')
    return {'status': 'bytes-verified-awaiting-interaction', 'requests': len(routes)}


def result(root, files, verified, run_id, attempt):
    require(re.fullmatch('[1-9][0-9]*', run_id or '') and attempt == '1', 'RUN_IDENTITY')
    target = subprocess.check_output(['git', '-C', str(root), 'rev-parse', 'HEAD']).decode().strip()
    require(re.fullmatch('[a-f0-9]{40}', target), 'TARGET_COMMIT')
    rows = [[name, '100644', sha(data)] for name, data in sorted(files.items())]
    static = sha((json.dumps(rows, ensure_ascii=False, separators=(',', ':')) + '\n').encode())
    return {**verified, 'version': 1, 'site': SITE, 'target_commit': target,
            'static_sha256': static, 'pages_run_id': int(run_id), 'run_attempt': 1,
            'interaction_status': 'pending'}


def main():
    p = argparse.ArgumentParser(description=__doc__); p.add_argument('action', choices=['collect', 'verify'])
    p.add_argument('--root', type=Path, required=True); p.add_argument('--output', type=Path)
    p.add_argument('--allow-network', action='store_true'); p.add_argument('--run-id'); p.add_argument('--run-attempt')
    p.add_argument('--report', type=Path); a = p.parse_args()
    files = load(a.root)
    if a.action == 'collect':
        require(a.output is not None and not a.output.exists(), 'NEW_OUTPUT_REQUIRED')
        a.output.mkdir(parents=True)
        for name, data in files.items():
            path = a.output / name; path.parent.mkdir(parents=True, exist_ok=True); path.write_bytes(data)
        print(json.dumps({'status': 'static-files-collected', 'files': len(files)}))
    else:
        require(a.allow_network, 'NETWORK_DISABLED')
        verified = verify(files)
        if a.report:
            verified = result(a.root, files, verified, a.run_id, a.run_attempt)
            with a.report.open('x') as f: f.write(json.dumps(verified) + '\n')
        print(json.dumps(verified))


if __name__ == '__main__': main()
