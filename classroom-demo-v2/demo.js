'use strict';

const byId = (id) => document.getElementById(id);
const teacher = { name: '2026', password: '2026' };
let shared = { name: '2026', password: '2026' };
const accounts = [{ id: 1, name: '2026', password: '2026', active: true }];
const materials = [
  { title: '第一讲 · 课前讲义', kind: 'document', description: '复习课堂要点，准备本节练习。', studentId: null, visible: true },
  { title: '第一讲 · 课堂录音', kind: 'audio', description: '课后回顾本节内容。', studentId: null, visible: true },
  { title: '第二讲 · 练习资料', kind: 'document', description: '老师端可见的示例草稿。', studentId: null, visible: false },
];
let nextAccountId = 2;
let notice = '本周课堂讲义和录音示例已经开放，请在课后查看。';
let mode = 'shared';
let role = 'student';
let session = null;
let panel = 'materials';
let filter = 'all';
let saveEditor;
let toastTimer;

function makeElement(tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (value !== undefined) element.textContent = value;
  return element;
}

function action(label, handler, className = 'secondary') {
  const button = makeElement('button', className, label);
  button.type = 'button';
  button.addEventListener('click', handler);
  return button;
}

function message(value) {
  clearTimeout(toastTimer);
  byId('toast').textContent = value;
  if (value) toastTimer = setTimeout(() => { byId('toast').textContent = ''; }, 3400);
}

function updateNotice() {
  byId('public-notice').textContent = notice;
  byId('student-notice-copy').textContent = notice;
}

function showError(id, value) {
  const error = byId(id);
  error.textContent = value;
  error.hidden = !value;
}

function showPassword(visible) {
  const toggle = byId('toggle-password');
  byId('password').type = visible ? 'text' : 'password';
  toggle.textContent = visible ? '隐藏' : '显示';
  toggle.setAttribute('aria-pressed', String(visible));
  toggle.setAttribute('aria-label', visible ? '隐藏密码' : '显示密码');
}

function selectRole(value) {
  role = value;
  byId('role-student').setAttribute('aria-pressed', String(role === 'student'));
  byId('role-teacher').setAttribute('aria-pressed', String(role === 'teacher'));
  byId('login-hint').textContent = role === 'teacher'
    ? '演示老师账号和密码均为 2026。'
    : `当前为${mode === 'shared' ? '全班共用账号' : '一人一个账号'}模式。默认示例账号和密码均为 2026，学生使用老师发放的账号。`;
  byId('username').value = '2026';
  byId('password').value = '2026';
  showPassword(false);
  showError('login-error', '');
}

function matches(credential, name, password) {
  return credential.name === name && credential.password === password;
}

function authenticate(name, password) {
  if (role === 'teacher') return matches(teacher, name, password) ? { role } : null;
  if (mode === 'shared') return matches(shared, name, password) ? { role, name, studentId: null } : null;
  const account = accounts.find((item) => matches(item, name, password));
  if (!account) return null;
  if (!account.active) {
    showError('login-error', '此学生账号已暂停，请联系老师。');
    return null;
  }
  return { role, name, studentId: account.id };
}

function enterWorkspace() {
  const isTeacher = session.role === 'teacher';
  byId('welcome').hidden = true;
  byId('workspace').hidden = false;
  byId('teacher-nav').hidden = !isTeacher;
  byId('add-material').hidden = !isTeacher;
  byId('student-notice').hidden = isTeacher;
  byId('workspace-kicker').textContent = isTeacher ? '老师入口' : '学生入口';
  byId('workspace-title').textContent = isTeacher ? '老师工作台' : '我的教学资料';
  byId('workspace-note').textContent = isTeacher ? '在这里管理资料、学生账号和公开通知。' : `已登录 · ${session.name}`;
  byId('materials-title').textContent = isTeacher ? '教学资料' : '资料列表';
  byId('materials-note').textContent = isTeacher ? '设置哪些资料可以查看，或预览示例页面。' : '打开老师已向此账号开放的课件和音频。';
  filter = 'all';
  openPanel('materials');
  byId('workspace-title').focus();
}

function openPanel(value) {
  panel = value;
  for (const name of ['materials', 'accounts', 'notices']) byId(name).hidden = name !== panel;
  for (const button of document.querySelectorAll('[data-panel]')) button.setAttribute('aria-pressed', String(button.dataset.panel === panel));
  if (panel === 'materials') renderMaterials();
  if (panel === 'accounts') renderAccounts();
  if (panel === 'notices') byId('notice-message').value = notice;
}

function tag(value, active = false) {
  return makeElement('span', active ? 'tag tag-green' : 'tag', value);
}

function visibilityLabel(material) {
  if (!material.visible) return '已隐藏';
  if (material.studentId === null) return '所有已登录学生';
  const account = accounts.find((item) => item.id === material.studentId);
  return account ? `仅 ${account.name}` : '指定账号已删除';
}

function renderMaterials() {
  const list = byId('material-list');
  const isTeacher = session.role === 'teacher';
  for (const button of document.querySelectorAll('[data-filter]')) button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
  list.replaceChildren();
  for (const material of materials) {
    if (filter !== 'all' && material.kind !== filter) continue;
    if (!isTeacher && (!material.visible || (material.studentId !== null && material.studentId !== session.studentId))) continue;
    const card = makeElement('article', 'card resource');
    const markers = makeElement('div', 'resource-top');
    markers.append(tag(material.kind === 'audio' ? '音频' : '课件', true));
    if (isTeacher) markers.append(tag(visibilityLabel(material)));
    const actions = makeElement('div', 'account-actions');
    actions.append(action(material.kind === 'audio' ? '查看播放器' : '打开课件', () => previewMaterial(material)));
    if (isTeacher) {
      actions.append(
        action('编辑', () => editMaterial(material), 'text-button'),
        action(material.visible ? '隐藏' : '显示', () => {
          material.visible = !material.visible;
          renderMaterials();
          message(material.visible ? '已显示资料。' : '已隐藏资料。');
        }, 'text-button'),
        action('删除', () => confirmDeletion('删除资料', material.title, () => {
          materials.splice(materials.indexOf(material), 1);
          renderMaterials();
          message('已删除示例资料。');
        }), 'danger'),
      );
    }
    card.append(markers, makeElement('h3', '', material.title), makeElement('p', 'muted', material.description), actions);
    list.append(card);
  }
  if (!list.childElementCount) list.append(makeElement('p', 'empty', '暂时没有此类资料。'));
}

function previewMaterial(material) {
  const audio = material.kind === 'audio';
  byId('preview-kind').textContent = audio ? '音频预览' : '课件预览';
  byId('preview-title').textContent = material.title;
  byId('preview-note').textContent = material.description;
  byId('preview-placeholder').replaceChildren(
    makeElement('strong', '', audio ? '课堂录音播放器位置' : '讲义内容预览位置'),
    makeElement('p', 'muted', audio ? '老师上传音频后，可在这里收听。' : '老师上传课件后，可在这里查看。'),
  );
  byId('preview').showModal();
}

function renderAccounts() {
  const individual = mode === 'individual';
  byId('shared-settings').hidden = individual;
  byId('individual-settings').hidden = !individual;
  byId('shared-name').textContent = shared.name;
  for (const button of document.querySelectorAll('[data-mode]')) button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
  const list = byId('account-list');
  list.replaceChildren();
  for (const account of accounts) {
    const row = makeElement('div', 'account-row');
    const identity = makeElement('div', '');
    identity.append(makeElement('strong', '', account.name), makeElement('p', 'muted', account.active ? '可以登录' : '已暂停'));
    const actions = makeElement('div', 'account-actions');
    actions.append(
      action('改密码', () => editCredential(account)),
      action(account.active ? '暂停' : '启用', () => {
        account.active = !account.active;
        renderAccounts();
        message(account.active ? '账号已启用。' : '账号已暂停。');
      }),
      action('删除', () => confirmDeletion('删除学生账号', account.name, () => {
        accounts.splice(accounts.indexOf(account), 1);
        renderAccounts();
        message('学生账号已删除。');
      }), 'danger'),
    );
    row.append(identity, actions);
    list.append(row);
  }
  if (!list.childElementCount) list.append(makeElement('p', 'empty', '还没有学生账号。可以新增一名示例学生。'));
}

function field(config) {
  const wrapper = makeElement('div', 'field');
  const label = makeElement('label', '', config.label);
  const control = makeElement(config.options ? 'select' : 'input', '');
  control.name = config.name;
  control.id = `editor-${config.name}`;
  label.htmlFor = control.id;
  if (config.options) {
    for (const [value, caption] of config.options) {
      const option = makeElement('option', '', caption);
      option.value = value;
      control.append(option);
    }
  } else {
    control.type = config.type || 'text';
    control.maxLength = config.maxLength || 64;
    control.required = config.required !== false;
    if (config.placeholder) control.placeholder = config.placeholder;
  }
  control.value = config.value || '';
  wrapper.append(label, control);
  return wrapper;
}

function openEditor(title, note, fields, onSave, label = '保存') {
  byId('editor-title').textContent = title;
  byId('editor-note').textContent = note;
  byId('editor-fields').replaceChildren(...fields.map(field));
  byId('editor-save').textContent = label;
  byId('editor-save').className = label === '确认删除' ? 'danger' : 'primary';
  showError('editor-error', '');
  saveEditor = onSave;
  byId('editor').showModal();
}

function confirmDeletion(title, name, onSave) {
  openEditor(title, `确定删除「${name}」吗？`, [], onSave, '确认删除');
  byId('editor-cancel').focus();
}

function editCredential(credential) {
  const common = credential === shared;
  const isNew = !credential;
  const fields = [];
  if (isNew || common) fields.push({ label: '账号', name: 'account', maxLength: 24, value: credential?.name, placeholder: '例如 student02' });
  fields.push({ label: isNew ? '初始密码' : '新密码', name: 'secret', type: 'password', maxLength: 32, placeholder: '仅填写演示密码' });
  openEditor(
    common ? '修改全班账号密码' : isNew ? '新增学生账号' : '修改学生密码',
    common ? '保存后，请把新账号和密码发给全班。' : isNew ? '创建后由老师发放账号和密码。' : `保存后，账号 ${credential.name} 使用新密码登录。`,
    fields,
    (values) => {
      const name = (values.get('account') || credential?.name || '').trim();
      const password = values.get('secret');
      if (!name || !password.trim()) return '账号和密码不能为空。';
      if (isNew && accounts.some((item) => item.name === name)) return '此账号已存在，请换一个名字。';
      if (common) shared = { name, password };
      else if (isNew) accounts.push({ id: nextAccountId++, name, password, active: true });
      else credential.password = password;
      renderAccounts();
      message(isNew ? '学生账号已创建。' : '登录信息已更新。');
    },
    isNew ? '创建账号' : '保存',
  );
}

function editMaterial(material) {
  const target = String(material?.studentId ?? 'all');
  const targets = [['all', '所有已登录学生']];
  if (mode === 'individual' || target !== 'all') {
    targets.push(...accounts.map((account) => [String(account.id), `仅 ${account.name}`]));
    if (!targets.some(([value]) => value === target)) targets.push([target, '指定账号已删除']);
  }
  openEditor(material ? '编辑资料' : '新增示例资料', '填写占位标题和说明即可，演示页无需上传真实文件。', [
    { label: '资料标题', name: 'title', value: material?.title, placeholder: '例如 第三讲 · 复习资料' },
    { label: '资料类型', name: 'kind', options: [['document', '课件'], ['audio', '音频']], value: material?.kind || 'document' },
    { label: '查看范围', name: 'access', options: targets, value: target },
    { label: '简介（可选）', name: 'description', value: material?.description, required: false, maxLength: 100 },
  ], (values) => {
    const title = values.get('title').trim();
    if (!title) return '请输入资料标题。';
    const access = values.get('access');
    const updated = { title, kind: values.get('kind'), description: values.get('description').trim(), studentId: access === 'all' ? null : Number(access) };
    if (material) Object.assign(material, updated);
    else {
      materials.push({ ...updated, visible: true });
      filter = 'all';
    }
    renderMaterials();
    message(material ? '已保存资料。' : '已添加示例资料。');
  });
}

byId('role-student').addEventListener('click', () => selectRole('student'));
byId('role-teacher').addEventListener('click', () => selectRole('teacher'));
byId('toggle-password').addEventListener('click', () => showPassword(byId('password').type === 'password'));
byId('login-form').addEventListener('input', () => showError('login-error', ''));
byId('login-form').addEventListener('submit', (event) => {
  event.preventDefault();
  showError('login-error', '');
  session = authenticate(byId('username').value.trim(), byId('password').value);
  if (session) enterWorkspace();
  else if (byId('login-error').hidden) showError('login-error', '账号或密码不正确，请核对登录身份和老师发放的登录信息。');
});
byId('logout').addEventListener('click', () => {
  session = null;
  byId('workspace').hidden = true;
  byId('welcome').hidden = false;
  message('');
  selectRole(role);
  byId(`role-${role}`).focus();
});
for (const button of document.querySelectorAll('[data-panel]')) button.addEventListener('click', () => openPanel(button.dataset.panel));
for (const button of document.querySelectorAll('[data-filter]')) button.addEventListener('click', () => {
  filter = button.dataset.filter;
  renderMaterials();
});
for (const button of document.querySelectorAll('[data-mode]')) button.addEventListener('click', () => {
  if (mode === button.dataset.mode) return;
  mode = button.dataset.mode;
  renderAccounts();
  message(mode === 'shared' ? '已切换到全班共用账号。' : '已切换到每名学生一个账号。');
});
byId('add-material').addEventListener('click', () => editMaterial());
byId('add-account').addEventListener('click', () => editCredential());
byId('edit-shared').addEventListener('click', () => editCredential(shared));
byId('editor-cancel').addEventListener('click', () => byId('editor').close());
byId('editor-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const error = saveEditor(new FormData(event.currentTarget));
  if (error) showError('editor-error', error);
  else byId('editor').close();
});
byId('notice-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const value = byId('notice-message').value.trim();
  if (!value) return;
  notice = value;
  updateNotice();
  message('已更新公开公告。');
});

selectRole('student');
updateNotice();
