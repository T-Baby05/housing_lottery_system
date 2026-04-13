/**
 * housingPrototypeState.v1
 * Shared state and data for the Housing Lottery Prototype
 */

const STATE_KEY = 'housingPrototypeState.v1';

// Initial Mock Data
const MOCK_DATA = {
  projects: [
    { id: 'P001', name: '锦绣花园还房项目', status: '进行中', location: 'XX区中心', totalHouseholds: 24, totalUnits: 16, currentStage: 5 },
    { id: 'P002', name: '金秋园二期还房项目', status: '已归档', location: 'YY区北', totalHouseholds: 180, totalUnits: 150, currentStage: 10 }
  ],
  households: [
    { id: 'H001', name: '张三', householdId: '20260001', idLast4: '1234', status: '已审核', category: '拆迁户', members: 3, proxy: '无' },
    { id: 'H002', name: '李四', householdId: '20260002', idLast4: '5678', status: '已审核', category: '拆迁户', members: 2, proxy: '王五' },
    { id: 'H003', name: '王五', householdId: '20260003', idLast4: '9012', status: '异常', category: '拆迁户', members: 4, proxy: '无' },
    // ... adding more below in initialization
  ],
  units: [
    { id: 'U001', building: '1号楼', unit: '1-101', type: 'A型', area: '120㎡', status: '待分配' },
    { id: 'U002', building: '1号楼', unit: '1-102', type: 'B型', area: '90㎡', status: '待分配' },
    { id: 'U003', building: '2号楼', unit: '2-301', type: 'C型', area: '110㎡', status: '待分配' },
    // ...
  ],
  wishes: [
    { householdId: 'H001', choices: ['A型', 'B型', 'C型', 'D型'] },
    { householdId: 'H002', choices: ['B型', 'A型', 'C型', 'D型'] },
    // ...
  ]
};

// Generate more households for demonstration (total 24)
for (let i = 4; i <= 24; i++) {
  MOCK_DATA.households.push({
    id: `H${i.toString().padStart(3, '0')}`,
    name: `住户${i}`,
    householdId: `2026${i.toString().padStart(4, '0')}`,
    idLast4: Math.floor(1000 + Math.random() * 9000).toString(),
    status: '已审核',
    category: '拆迁户',
    members: Math.floor(1 + Math.random() * 5),
    proxy: '无'
  });
}

// State Management
const PrototypeState = {
  data: null,

  init() {
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) {
      this.data = JSON.parse(saved);
    } else {
      this.data = {
        currentProjectId: 'P001',
        lockState: false,
        roundExecutionState: { A: false, B: false, C: false, D: false },
        publishedState: false,
        archivedState: false,
        lotteryResults: [], // { round, householdId, unitId }
        checkins: [], // { householdId, time }
        ...MOCK_DATA
      };
      this.save();
    }
  },

  save() {
    localStorage.setItem(STATE_KEY, JSON.stringify(this.data));
  },

  reset() {
    localStorage.removeItem(STATE_KEY);
    location.reload();
  },

  getCurrentProject() {
    return this.data.projects.find(p => p.id === this.data.currentProjectId);
  },

  updateProject(id) {
    this.data.currentProjectId = id;
    this.save();
    location.reload();
  }
};

// Common UI Components
const UI = {
  renderSidebar(activePage) {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    const navItems = [
      { id: 'index', label: '项目工作台', icon: '🏠', path: 'index.html' },
      { id: 'overview', label: '项目详情/阶段总览', icon: '📊', path: 'project-overview.html' },
      { id: 'households', label: '住户管理', icon: '👥', path: 'households.html' },
      { id: 'units', label: '房源管理', icon: '🏢', path: 'units.html' },
      { id: 'review', label: '意愿与审核', icon: '📋', path: 'review.html' },
      { id: 'lottery', label: '摇号控制台', icon: '🎲', path: 'lottery.html' },
      { id: 'notifications', label: '通知与查询管理', icon: '🔔', path: 'notifications.html' },
      { id: 'onsite', label: '现场服务', icon: '📍', path: 'onsite.html' },
      { id: 'archive', label: '结果与归档', icon: '📁', path: 'archive.html' }
    ];

    sidebar.innerHTML = `
      <div class="sidebar-header">
        <div class="sidebar-logo">还房业务平台 <span style="font-size: 12px; font-weight: 400; opacity: 0.7">v1.0</span></div>
      </div>
      <div class="sidebar-nav">
        ${navItems.map(item => `
          <a href="${item.path}" class="nav-item ${activePage === item.id ? 'active' : ''}">
            <span>${item.icon}</span>
            <span>${item.label}</span>
          </a>
        `).join('')}
      </div>
      <div class="sidebar-footer">
        <div>当前用户: 管理员</div>
        <button onclick="PrototypeState.reset()" style="margin-top: 8px; font-size: 11px; cursor: pointer; background: none; border: 1px solid #ccc; padding: 2px 4px;">重置演示数据</button>
      </div>
    `;
  },

  renderTopBar() {
    const topBar = document.querySelector('.top-bar');
    if (!topBar) return;

    const project = PrototypeState.getCurrentProject();
    const otherProjects = PrototypeState.data.projects.filter(p => p.id !== project.id);

    topBar.innerHTML = `
      <div class="project-selector">
        <span style="font-weight: 700; color: var(--accent)">当前项目:</span>
        <select onchange="PrototypeState.updateProject(this.value)" style="padding: 4px 8px; border-radius: 4px; border: 1px solid var(--line);">
          <option value="${project.id}" selected>${project.name}</option>
          ${otherProjects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
        </select>
        <span class="badge ${project.status === '已归档' ? 'badge-info' : 'badge-success'}">${project.status}</span>
      </div>
      <div class="user-info">
        <span style="font-size: 14px; margin-right: 12px;">2026年4月10日</span>
        <span style="font-weight: 600;">管理员</span>
      </div>
    `;
  }
};

// Initialize State
PrototypeState.init();
