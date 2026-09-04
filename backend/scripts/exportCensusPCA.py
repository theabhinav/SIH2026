import zipfile
import json
import time
import sys
import os

xlsx_path = 'C:/Users/Narayan Kumar/Downloads/2011-IndiaStateDistSbDistVill-0000.xlsx'
out_path = 'C:/Users/Narayan Kumar/Downloads/census_pca_villages.jsonl'

print('==================================================', flush=True)
print('[+] Exporting Census 2011 PCA Village Demographics', flush=True)
print('Source:', xlsx_path, flush=True)
print('Output:', out_path, flush=True)
print('==================================================', flush=True)

t0 = time.time()
z = zipfile.ZipFile(xlsx_path)

print('Reading sharedStrings.xml...', flush=True)
import xml.etree.ElementTree as ET

shared_strings = []
with z.open('xl/sharedStrings.xml') as f:
    for event, elem in ET.iterparse(f, events=('end',)):
        if elem.tag.endswith('}si'):
            t = elem.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
            shared_strings.append(t.text if t is not None else '')
            elem.clear()

print(f'[+] Loaded {len(shared_strings):,} strings in {time.time() - t0:.2f}s', flush=True)

village_idx = None
for i, s in enumerate(shared_strings):
    if s == 'VILLAGE':
        village_idx = str(i)
        break

if not village_idx:
    print('[-] Error: VILLAGE string not found in sharedStrings', flush=True)
    sys.exit(1)

print(f'VILLAGE string index: {village_idx}', flush=True)

t1 = time.time()
out_file = open(out_path, 'w', encoding='utf-8')
village_count = 0

with z.open('xl/worksheets/sheet1.xml') as f:
    buf = ''
    while True:
        chunk = f.read(1024 * 1024 * 8) # 8 MB chunk
        if not chunk:
            break
        buf += chunk.decode('utf-8', errors='ignore')
        rows = buf.split('</row>')
        buf = rows.pop()

        for row in rows:
            if f'<v>{village_idx}</v>' not in row:
                continue

            def get_val(col):
                pos = row.find(f'r="{col}')
                if pos == -1:
                    return None
                v_start = row.find('<v>', pos)
                if v_start == -1 or v_start > pos + 80:
                    return None
                v_end = row.find('</v>', v_start)
                return row[v_start+3:v_end]

            d_idx = get_val('D')
            if not d_idx or not d_idx.isdigit():
                continue

            v_code = shared_strings[int(d_idx)]
            if not v_code or v_code == '000000':
                continue

            def to_int(v):
                if not v:
                    return None
                try:
                    return int(v)
                except:
                    return None

            data = {
                'code': str(v_code),
                'hh': to_int(get_val('J')),
                'tot_p': to_int(get_val('K')),
                'tot_m': to_int(get_val('L')),
                'tot_f': to_int(get_val('M')),
                'p_sc': to_int(get_val('Q')),
                'p_st': to_int(get_val('T')),
                'p_lit': to_int(get_val('W')),
                'work_p': to_int(get_val('AC')),
                'main_p': to_int(get_val('AF')),
                'marg_p': to_int(get_val('AN'))
            }

            out_file.write(json.dumps(data) + '\n')
            village_count += 1

            if village_count % 100000 == 0:
                print(f'Exported {village_count:,} villages ({time.time() - t1:.1f}s)...', flush=True)

out_file.close()
print(f'\n[+] Successfully exported {village_count:,} villages to {out_path} in {time.time() - t1:.2f}s', flush=True)
