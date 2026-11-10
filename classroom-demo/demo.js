'use strict';
const byId = (id) => document.getElementById(id);
const resources = [
  { title: '第一讲 · 音频示例', kind: '音频', visible: true },
  { title: '第一讲 · 课堂讲义', kind: '课件', visible: true },
];
let role = 'teacher';
let approved = true;

function selectRole(nextRole) {
  role = nextRole;
  for (const name of ['teacher', 'student']) {
    byId(name).setAttribute('aria-pressed', String(name === role));
  }
  byId('demo-user').value = `demo-${role}`;
}

function showPreview(resource) {
  const preview = byId('resource-preview');
  const message = document.createElement('p');
  message.className = 'muted';
  message.textContent = `${resource.title}：${resource.kind === '音频' ? '此处将显示音频播放器。' : '此处将显示课件预览。'}当前没有实际文件。`;
  preview.replaceChildren(message);
}

function renderDashboard() {
  const teacher = role === 'teacher';
  byId('dashboard-title').textContent = teacher ? '老师工作台' : '学生资料室';
  byId('role-note').textContent = teacher ? '发布通知、整理资料，管理学生访问。' : '在这里查看老师开放的课程资料。';
  byId('teacher-panel').hidden = !teacher;
  byId('resource-heading').textContent = teacher ? '管理资料' : '我的学习资料';
  byId('permission-label').textContent = approved ? '已批准访问' : '未批准访问';
  byId('permission').textContent = approved ? '撤销授权' : '批准访问';
  const list = byId('resource-list');
  list.replaceChildren();
  byId('resource-preview').replaceChildren();
  if (!teacher && !approved) {
    list.textContent = '此学生尚未获得访问权限。请联系老师开通。';
    return;
  }
  const available = teacher ? resources : resources.filter((resource) => resource.visible);
  if (!available.length) list.textContent = '暂无可用资料。';
  for (const resource of available) {
    const row = document.createElement('div');
    row.className = 'row';
    const name = document.createElement('span');
    name.textContent = `${resource.kind} · ${resource.title}${teacher && !resource.visible ? '（已隐藏）' : ''}`;
    const action = document.createElement('button');
    action.type = 'button';
    action.textContent = teacher ? (resource.visible ? '隐藏' : '恢复展示') : (resource.kind === '音频' ? '打开播放器' : '查看课件');
    action.addEventListener('click', () => {
      if (teacher) {
        resource.visible = !resource.visible;
        renderDashboard();
      } else {
        showPreview(resource);
      }
    });
    row.append(name, action);
    list.append(row);
  }
}

for (const name of ['teacher', 'student']) byId(name).onclick = () => selectRole(name);
byId('login').onsubmit = (event) => {
  event.preventDefault();
  byId('entry').hidden = true;
  byId('dashboard').hidden = false;
  byId('status').textContent = '';
  renderDashboard();
  byId('dashboard-title').focus();
};
byId('logout').onclick = () => {
  byId('dashboard').hidden = true;
  byId('entry').hidden = false;
  byId('status').textContent = '';
  byId(role).focus();
};
byId('permission').onclick = () => {
  approved = !approved;
  renderDashboard();
  byId('status').textContent = '已更新示例学生权限。';
};
byId('resource-form').onsubmit = (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const fields = new FormData(form);
  const title = fields.get('title').trim();
  if (!title) return;
  resources.push({ title, kind: fields.get('kind'), visible: true });
  form.reset();
  renderDashboard();
  byId('status').textContent = '已添加示例资料。';
};
byId('notice-form').onsubmit = (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const message = new FormData(form).get('message').trim();
  if (!message) return;
  byId('notice-text').textContent = message;
  form.reset();
  byId('status').textContent = '已更新演示通知。';
};
