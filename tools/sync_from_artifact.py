#!/usr/bin/env python3
"""아티팩트(편집용 페이지)의 최신 내용을 이 사이트 파일로 옮긴다.

사용법:
    python3 -I tools/sync_from_artifact.py <아티팩트 index.html> <사진 폴더> <저장소 폴더>

- <아티팩트 index.html>: 아티팩트에서 내려받은 페이지 파일. 안의 page-state JSON을 읽는다.
- <사진 폴더>: 아티팩트 사진들을 '<id>.<확장자>' 이름으로 받아 둔 폴더.
- 바꾸는 파일: data/site.json, images/ (필요한 사진만 추가), index.html 맨 위 미리보기 정보.
- 그 밖의 파일은 건드리지 않는다.
"""
import html
import json
import os
import re
import shutil
import sys

SITE_URL = 'https://tkdgus530-netizen.github.io/'
STATE_TAG = '<script type="application/json" id="page-state">{'


def read_state(page_file):
    src = open(page_file, encoding='utf8').read()
    if src.count(STATE_TAG) != 1:
        sys.exit('page-state 데이터를 찾지 못했습니다: ' + page_file)
    a = src.index(STATE_TAG) + len(STATE_TAG) - 1
    b = src.index('</script>', a)
    return json.loads(src[a:b])


def normalize(st):
    """아티팩트가 화면을 그리기 전에 하던 정리를 똑같이 한다."""
    for it in st['reviews']['items']:
        if 'year' not in it:
            m = re.search(r'(\d{4})\s*년\s*(\d{1,2})\s*월', it.get('meta', ''))
            it['year'] = m.group(1) if m else ''
            it['month'] = str(int(m.group(2))) if m else ''
            if m:
                it['meta'] = re.sub(r'^[\s·,\-]+|[\s·,\-]+$', '', it['meta'].replace(m.group(0), ''))
    sc = st.setdefault('schedule', {'heading': '예식 일정', 'lead': '', 'items': []})
    sc.pop('open', None)
    sc.pop('close', None)
    for it in sc['items']:
        if 'start' not in it:
            it['start'] = it.pop('time', '')
            it['end'] = ''
    st.setdefault('meta', {})['siteUrl'] = SITE_URL
    return st


def map_images(st, blob_dir, repo):
    """'/_blob/<id>' 사진 주소를 'images/...' 로 바꾸고 파일을 복사한다."""
    blobs = {os.path.splitext(f)[0]: f for f in os.listdir(blob_dir)}
    os.makedirs(os.path.join(repo, 'images'), exist_ok=True)
    missing = []

    def fix(value, name=None):
        m = re.match(r'^/_blob/([0-9a-f]+)$', value or '')
        if not m:
            return value or ''
        f = blobs.get(m.group(1))
        if not f:
            missing.append(m.group(1))
            return ''
        ext = os.path.splitext(f)[1]
        target = 'images/' + (name or m.group(1)) + ext
        shutil.copyfile(os.path.join(blob_dir, f), os.path.join(repo, target))
        return target

    st['hero']['photo'] = fix(st['hero'].get('photo', ''), 'profile')
    for it in st['reviews']['items']:
        it['image'] = fix(it.get('image', ''))
    for it in st['album']['items']:
        it['src'] = fix(it.get('src', ''))
    st['album']['items'] = [x for x in st['album']['items'] if x['src']]
    return missing


def update_head(repo, st):
    """index.html 맨 위의 제목·설명·미리보기 사진을 내용과 맞춘다."""
    path = os.path.join(repo, 'index.html')
    doc = open(path, encoding='utf8').read()
    title = html.escape(st['meta'].get('title') or st.get('brand', ''), quote=True)
    desc = html.escape(st['hero'].get('lead', ''), quote=True)
    doc = re.sub(r'<title>.*?</title>', '<title>' + title + '</title>', doc, count=1, flags=re.S)
    doc = re.sub(r'(<meta name="description" content=")[^"]*(">)', r'\g<1>' + desc.replace('\\', r'\\') + r'\g<2>', doc, count=1)
    doc = re.sub(r'(<meta property="og:title" content=")[^"]*(">)', r'\g<1>' + title.replace('\\', r'\\') + r'\g<2>', doc, count=1)
    doc = re.sub(r'(<meta property="og:description" content=")[^"]*(">)', r'\g<1>' + desc.replace('\\', r'\\') + r'\g<2>', doc, count=1)
    photo = st['hero'].get('photo', '')
    og_img = '<meta property="og:image" content="' + SITE_URL + photo + '">\n' if photo else ''
    doc = re.sub(r'<meta property="og:image" content="[^"]*">\n', '', doc)
    doc = doc.replace('<link rel="canonical"', og_img + '<link rel="canonical"', 1)
    open(path, 'w', encoding='utf8').write(doc)


def main():
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    page_file, blob_dir, repo = sys.argv[1:]
    st = normalize(read_state(page_file))
    missing = map_images(st, blob_dir, repo)
    with open(os.path.join(repo, 'data', 'site.json'), 'w', encoding='utf8') as fp:
        json.dump(st, fp, ensure_ascii=False, indent=2)
        fp.write('\n')
    update_head(repo, st)
    print(json.dumps({
        'reviews': len(st['reviews']['items']),
        'schedule': len(st['schedule']['items']),
        'album': len(st['album']['items']),
        'missing_images': missing,
    }, ensure_ascii=False))


if __name__ == '__main__':
    main()
