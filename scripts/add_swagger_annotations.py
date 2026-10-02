import os, re, glob

base = 'D:/EasyEcole/easy-ecole-backend/src/modules'

modules_to_annotate = ['etablissement', 'ged', 'marche', 'menu', 'parent', 'qualite']

def get_tag(module_name):
    tag_map = {
        'etablissement': 'Etablissement',
        'ged': 'GED',
        'marche': 'Marche',
        'menu': 'Menu',
        'parent': 'Parent',
        'qualite': 'Qualite',
    }
    return tag_map.get(module_name, module_name)

def generate_openapi_annotation(method, path, tag, summary=''):
    lines = []
    lines.append('    /**')
    lines.append('     * @openapi')
    lines.append(f'     * {path}:')
    lines.append(f'     *   {method.lower()}:')
    lines.append(f'     *     tags: [{tag}]')
    if summary:
        lines.append(f'     *     summary: {summary}')
    else:
        lines.append(f'     *     summary: Endpoint {method} {path}')
    lines.append('     *     security: [{ bearerAuth: [] }]')
    lines.append('     *     responses:')
    lines.append('     *       200:')
    lines.append('     *         description: Success')
    lines.append('     */')
    return '\n'.join(lines)

def process_router_file(filepath, module_name):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if '@openapi' in content:
        return False, 0

    tag = get_tag(module_name)
    annotations_added = 0

    # Find all route method calls: .get('/path', ...), .post('/path', ...), etc.
    # Pattern: .get('/path', [Authenticate], Controller.method) or .get('/path', Controller.method)
    route_pattern = re.compile(r"(\.(get|post|put|delete|patch)\s*\(\s*['\"]([^'\"]+)['\"])")

    def add_annotation(match):
        nonlocal annotations_added
        full_match = match.group(1)
        method = match.group(2).upper()
        path = match.group(3)

        # Generate a simple summary
        summary = f"{method} {path}"

        annotation = generate_openapi_annotation(method, path, tag, summary)
        annotations_added += 1
        return annotation + '\n' + full_match

    new_content = route_pattern.sub(add_annotation, content)

    if annotations_added > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True, annotations_added

    return False, 0

def process_module_routes_file(filepath, module_name):
    """Process module-level Routes.ts files that have direct route definitions."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if '@openapi' in content:
        return False, 0

    tag = get_tag(module_name)
    annotations_added = 0

    # Find routes like router.get('/path', ...) or router.post('/path', ...)
    route_pattern = re.compile(r"(\.(get|post|put|delete|patch)\s*\(\s*['\"]([^'\"]+)['\"])")

    def add_annotation(match):
        nonlocal annotations_added
        full_match = match.group(1)
        method = match.group(2).upper()
        path = match.group(3)

        summary = f"{method} {path}"
        annotation = generate_openapi_annotation(method, path, tag, summary)
        annotations_added += 1
        return annotation + '\n' + full_match

    new_content = route_pattern.sub(add_annotation, content)

    if annotations_added > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True, annotations_added

    return False, 0

total_files = 0
total_annotations = 0

for mod in modules_to_annotate:
    mod_dir = os.path.join(base, mod)
    if not os.path.isdir(mod_dir):
        continue

    # Process routers/ directory
    routers_dir = os.path.join(mod_dir, 'routers')
    if os.path.isdir(routers_dir):
        for ts_file in glob.glob(os.path.join(routers_dir, '*.ts')):
            changed, count = process_router_file(ts_file, mod)
            if changed:
                total_files += 1
                total_annotations += count
                print(f"  Annotated {os.path.basename(ts_file)}: {count} routes")

    # Process root-level route files (for menu, parent)
    for ts_file in glob.glob(os.path.join(mod_dir, '*.ts')):
        basename = os.path.basename(ts_file)
        if basename.endswith('Routes.ts') or basename.endswith('Router.ts'):
            changed, count = process_module_routes_file(ts_file, mod)
            if changed:
                total_files += 1
                total_annotations += count
                print(f"  Annotated {basename}: {count} routes")

print(f"\nTotal: {total_files} files annotated with {total_annotations} route annotations")
