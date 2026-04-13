(function () {
  const roundOrder = ["A", "B", "C", "D"];

  const stageTemplates = [
    {
      id: "stage-01",
      title: "项目启动",
      window: "活动前 45 - 35 天",
      duration: "约 10 天",
      focus: "成立工作专班，明确组织模式、职责分工、总体计划和活动日目标。",
      tasks: ["启动会纪要", "职责分工", "活动日初步锁定"],
      outputs: ["项目启动会纪要", "任务分工表", "总排期表"],
    },
    {
      id: "stage-02",
      title: "规则与基础数据准备",
      window: "活动前 35 - 25 天",
      duration: "约 10 天",
      focus: "整理房源台账、住户底册、编号规则和采集口径。",
      tasks: ["房型分类", "编号规则", "采集模板准备"],
      outputs: ["房源基础台账", "住户底册", "规则初稿"],
    },
    {
      id: "stage-03",
      title: "还房户信息采集",
      window: "活动前 25 - 18 天",
      duration: "约 7 天",
      focus: "采集身份信息、联系方式、代理信息和房型意愿。",
      tasks: ["信息采集", "志愿填报", "问题清单梳理"],
      outputs: ["信息采集表", "房型意愿汇总表", "问题清单"],
    },
    {
      id: "stage-04",
      title: "审核确认与意愿锁定",
      window: "活动前 18 - 12 天",
      duration: "约 6 天",
      focus: "完成资格审核、重复校验、异常修正和最终名单确认。",
      tasks: ["资格核验", "异常修正", "住户确认签字"],
      outputs: ["最终参与名单", "意愿确认清单", "异常处理记录"],
    },
    {
      id: "stage-05",
      title: "系统导入与校验",
      window: "活动前 12 - 9 天",
      duration: "约 3 天",
      focus: "导入住户、房源和意愿数据，试跑摇号逻辑并核验查询输出。",
      tasks: ["数据导入", "试跑四轮摇号", "查询逻辑校验"],
      outputs: ["系统导入清单", "校验报告", "试跑记录"],
    },
    {
      id: "stage-06",
      title: "短信通知与信息公示",
      window: "活动前 9 - 5 天",
      duration: "约 4 天",
      focus: "统一发送活动通知、发布公告并同步告知查询方式。",
      tasks: ["短信通知", "公告发布", "回执留痕"],
      outputs: ["短信发送记录", "公示内容", "通知回执"],
    },
    {
      id: "stage-07",
      title: "联调彩排与会场准备",
      window: "活动前 5 - 1 天",
      duration: "约 4 天",
      focus: "完成彩排、二维码测试、会场布置、设备联调和应急预案检查。",
      tasks: ["全流程彩排", "二维码测试", "岗位培训"],
      outputs: ["彩排记录", "设备检查表", "应急预案"],
    },
    {
      id: "stage-08",
      title: "集中摇号活动",
      window: "T 日",
      duration: "1 天完成",
      focus: "完成签到核验、规则宣讲、四轮摇号、扫码查询和异议登记。",
      tasks: ["签到核验", "四轮摇号", "扫码查询"],
      outputs: ["摇号结果表", "候补顺序表", "现场记录"],
    },
    {
      id: "stage-09",
      title: "结果公示与异议复核",
      window: "T+1 - T+3",
      duration: "约 3 天",
      focus: "正式公示摇号结果，受理异议申请并形成复核意见。",
      tasks: ["结果公示", "异议登记", "复核结论"],
      outputs: ["结果公示表", "异议登记表", "复核结论"],
    },
    {
      id: "stage-10",
      title: "确认办理与归档收尾",
      window: "T+3 - T+7",
      duration: "约 4 天",
      focus: "办理结果确认，整理纸电档资料，形成归档目录和总结报告。",
      tasks: ["确认办理", "资料归档", "总结复盘"],
      outputs: ["归档目录", "确认资料", "活动总结"],
    },
  ];

  const activityAgenda = [
    { time: "08:00 - 09:00", title: "签到核验", detail: "分批入场，核验身份与代理材料。" },
    { time: "09:00 - 09:20", title: "开场与规则宣讲", detail: "介绍监督见证人员，宣读规则和纪律。" },
    { time: "09:20 - 09:30", title: "封存数据确认", detail: "确认名单、房源、意愿与轮次配置。" },
    { time: "09:30 - 10:50", title: "A/B/C/D 四轮摇号", detail: "每轮结束后同步开放二维码查询入口。" },
    { time: "10:50 - 11:20", title: "结果汇总公布", detail: "形成统计结果、候补顺序表和异常记录表。" },
    { time: "11:20 - 12:00", title: "查询辅导与异议登记", detail: "现场受理咨询、人工查询和异议登记。" },
    { time: "14:00 - 17:00", title: "结果确认或后续安排", detail: "根据项目实际，组织分批确认办理。" },
  ];

  const documentHighlights = [
    {
      title: "系统定位",
      detail: "系统应定义为多项目还房业务管理平台，而非单一摇号工具。",
    },
    {
      title: "关键控制点",
      detail: "锁定、摇号、发布、归档四个关键动作必须受控、留痕、可追溯。",
    },
    {
      title: "现场组织方式",
      detail: "采用按房型分轮电子摇号加统一二维码查询，降低现场拥堵与争议。",
    },
  ];

  const projects = [
    {
      id: "proj-qingxi",
      code: "QXHF-2026-01",
      shortName: "清溪一期",
      name: "清溪花园一期还房项目",
      description: "一期原型默认停留在“审核确认与意愿锁定”节点，便于从数据准备一路演示到结果归档。",
      owner: "陈海峰",
      contact: "139****1201",
      ruleVersion: "V1.3",
      baseStatus: "锁定中",
      baseStageIndex: 4,
      activityDate: "2026-05-18",
      activityLocation: "清溪文化中心一层主会场",
      totalHouseholds: 12,
      totalUnits: 8,
      quotaByType: { A: 2, B: 2, C: 2, D: 2 },
      autoRunDefault: false,
      defaultCurrent: true,
    },
    {
      id: "proj-binjiang",
      code: "BJHF-2025-02",
      shortName: "滨江东区",
      name: "滨江新苑东区还房项目",
      description: "历史已归档项目，用于演示结果发布后的查询态与后台只读态。",
      owner: "杨莉",
      contact: "138****8840",
      ruleVersion: "V1.1",
      baseStatus: "已归档",
      baseStageIndex: 10,
      activityDate: "2025-12-20",
      activityLocation: "滨江社区服务中心二层会议厅",
      totalHouseholds: 12,
      totalUnits: 8,
      quotaByType: { A: 2, B: 2, C: 2, D: 2 },
      autoRunDefault: true,
      defaultCurrent: false,
    },
  ];

  const notificationTemplates = [
    {
      id: "tpl-notice",
      title: "活动通知短信",
      channel: "短信",
      audience: "有效还房户",
      content: "【还房活动】您已进入 XX 项目电子摇号名单，请按通知时间携带材料准时到场。",
    },
    {
      id: "tpl-supplement",
      title: "补件提醒短信",
      channel: "短信",
      audience: "待补件住户",
      content: "【还房活动】您的资料仍有待补充，请于活动前完成补录和确认。",
    },
    {
      id: "tpl-query",
      title: "结果发布短信",
      channel: "短信",
      audience: "已完成摇号住户",
      content: "【还房活动】摇号结果已发布，请通过统一查询二维码或参与编号查询本人结果。",
    },
    {
      id: "tpl-public",
      title: "公示公告模板",
      channel: "公告",
      audience: "现场公示与归档",
      content: "XX 项目还房摇号结果公示，包含轮次结果、最终结果、候补顺序及后续办理提示。",
    },
  ];

  const maskName = function (name) {
    if (!name) {
      return "";
    }

    if (name.length === 2) {
      return name.charAt(0) + "*";
    }

    return name.charAt(0) + "*" + name.charAt(name.length - 1);
  };

  const createHousehold = function (projectId, index, seed) {
    return {
      id: projectId + "-household-" + String(index + 1).padStart(2, "0"),
      projectId: projectId,
      code: seed.code,
      name: seed.name,
      maskedName: maskName(seed.name),
      idSuffix: seed.idSuffix,
      phoneMasked: "138****" + seed.phoneSuffix,
      phoneFull: "1380000" + seed.phoneSuffix,
      qualification: seed.qualification,
      reviewStatus: seed.reviewStatus,
      anomaly: seed.anomaly,
      wishes: seed.wishes,
      address: seed.address,
      familyMembers: seed.familyMembers,
      proxy: seed.proxy,
      tags: seed.tags,
      note: seed.note,
    };
  };

  const householdSeeds = {
    "proj-qingxi": [
      {
        code: "QX001",
        name: "王建辉",
        idSuffix: "1286",
        phoneSuffix: "1286",
        qualification: "有效",
        reviewStatus: "审核通过",
        anomaly: "资料齐全",
        wishes: ["A", "B", "C", "D"],
        address: "清溪花园 2 栋 1 单元 502",
        familyMembers: [
          { name: "王建辉", relation: "户主" },
          { name: "周雨晴", relation: "配偶" },
          { name: "王子航", relation: "子女" },
        ],
        proxy: { enabled: false, name: "", relation: "", status: "未使用" },
        tags: ["首批确认"],
        note: "适合作为 A 户型第一轮查询示例。",
      },
      {
        code: "QX002",
        name: "李春芳",
        idSuffix: "2391",
        phoneSuffix: "2391",
        qualification: "有效",
        reviewStatus: "审核通过",
        anomaly: "联系方式已确认",
        wishes: ["A", "C", "D", "B"],
        address: "清溪花园 3 栋 2 单元 904",
        familyMembers: [
          { name: "李春芳", relation: "户主" },
          { name: "黄志文", relation: "配偶" },
        ],
        proxy: { enabled: false, name: "", relation: "", status: "未使用" },
        tags: ["短信已触达"],
        note: "A 户型未中签后自动流转到 C 户型。",
      },
      {
        code: "QX003",
        name: "周德军",
        idSuffix: "3407",
        phoneSuffix: "3407",
        qualification: "有效",
        reviewStatus: "审核通过",
        anomaly: "家庭成员已核验",
        wishes: ["A", "B", "D", "C"],
        address: "清溪花园 5 栋 1 单元 301",
        familyMembers: [
          { name: "周德军", relation: "户主" },
          { name: "吕小兰", relation: "配偶" },
          { name: "周可心", relation: "子女" },
        ],
        proxy: { enabled: false, name: "", relation: "", status: "未使用" },
        tags: ["现场签到样例"],
        note: "用于演示 A 轮后流转到 B 轮。",
      },
      {
        code: "QX004",
        name: "陈美萍",
        idSuffix: "4512",
        phoneSuffix: "4512",
        qualification: "有效",
        reviewStatus: "代理已核验",
        anomaly: "代理材料已补齐",
        wishes: ["A", "D", "C", "B"],
        address: "清溪花园 6 栋 2 单元 1203",
        familyMembers: [
          { name: "陈美萍", relation: "户主" },
          { name: "何小峰", relation: "代理人" },
        ],
        proxy: { enabled: true, name: "何小峰", relation: "侄子", status: "已核验" },
        tags: ["代理参与"],
        note: "代理住户，用于演示现场核验与代理标签。",
      },
      {
        code: "QX005",
        name: "刘海春",
        idSuffix: "5628",
        phoneSuffix: "5628",
        qualification: "有效",
        reviewStatus: "审核通过",
        anomaly: "房型意愿已确认",
        wishes: ["B", "C", "D"],
        address: "清溪花园 1 栋 1 单元 804",
        familyMembers: [
          { name: "刘海春", relation: "户主" },
          { name: "陈月娟", relation: "配偶" },
        ],
        proxy: { enabled: false, name: "", relation: "", status: "未使用" },
        tags: ["B 户型池"],
        note: "首志愿 B 户型样例。",
      },
      {
        code: "QX006",
        name: "何玉林",
        idSuffix: "6734",
        phoneSuffix: "6734",
        qualification: "有效",
        reviewStatus: "审核通过",
        anomaly: "材料齐全",
        wishes: ["B", "C", "D"],
        address: "清溪花园 7 栋 1 单元 506",
        familyMembers: [
          { name: "何玉林", relation: "户主" },
          { name: "许芳菲", relation: "配偶" },
          { name: "何梓航", relation: "子女" },
        ],
        proxy: { enabled: false, name: "", relation: "", status: "未使用" },
        tags: ["二维码测试"],
        note: "参与 B 户型轮次并演示后续流转。",
      },
      {
        code: "QX007",
        name: "许桂英",
        idSuffix: "7840",
        phoneSuffix: "7840",
        qualification: "有效",
        reviewStatus: "审核通过",
        anomaly: "联系方式已复核",
        wishes: ["B", "D", "C"],
        address: "清溪花园 8 栋 2 单元 702",
        familyMembers: [
          { name: "许桂英", relation: "户主" },
          { name: "周长江", relation: "配偶" },
        ],
        proxy: { enabled: false, name: "", relation: "", status: "未使用" },
        tags: ["B 户型池"],
        note: "用于演示 B 轮未中签后流转到 D 轮。",
      },
      {
        code: "QX008",
        name: "唐丽华",
        idSuffix: "8955",
        phoneSuffix: "8955",
        qualification: "有效",
        reviewStatus: "审核通过",
        anomaly: "高龄家庭",
        wishes: ["C", "D", "B"],
        address: "清溪花园 4 栋 1 单元 1602",
        familyMembers: [
          { name: "唐丽华", relation: "户主" },
          { name: "唐志国", relation: "家庭成员" },
        ],
        proxy: { enabled: false, name: "", relation: "", status: "未使用" },
        tags: ["高龄家庭"],
        note: "适合演示 C 户型中签与后续确认提示。",
      },
      {
        code: "QX009",
        name: "罗晓婷",
        idSuffix: "9062",
        phoneSuffix: "9062",
        qualification: "有效",
        reviewStatus: "审核通过",
        anomaly: "证件原件需现场核验",
        wishes: ["C", "B", "D"],
        address: "清溪花园 9 栋 1 单元 905",
        familyMembers: [
          { name: "罗晓婷", relation: "户主" },
          { name: "罗致远", relation: "父亲" },
        ],
        proxy: { enabled: false, name: "", relation: "", status: "未使用" },
        tags: ["现场核验"],
        note: "用于演示现场异常提示与人工复核。",
      },
      {
        code: "QX010",
        name: "孙伟杰",
        idSuffix: "1173",
        phoneSuffix: "1173",
        qualification: "有效",
        reviewStatus: "审核通过",
        anomaly: "材料齐全",
        wishes: ["D", "C", "B"],
        address: "清溪花园 10 栋 2 单元 1101",
        familyMembers: [
          { name: "孙伟杰", relation: "户主" },
          { name: "吕晨曦", relation: "配偶" },
        ],
        proxy: { enabled: false, name: "", relation: "", status: "未使用" },
        tags: ["D 户型池"],
        note: "适合作为 D 户型直接参摇样例。",
      },
      {
        code: "QX011",
        name: "郑秀梅",
        idSuffix: "2284",
        phoneSuffix: "2284",
        qualification: "待补件",
        reviewStatus: "待补件",
        anomaly: "委托书附件缺失",
        wishes: ["A", "B", "C"],
        address: "清溪花园 11 栋 1 单元 403",
        familyMembers: [
          { name: "郑秀梅", relation: "户主" },
          { name: "郑家豪", relation: "子女" },
        ],
        proxy: { enabled: true, name: "郑家豪", relation: "儿子", status: "待补签" },
        tags: ["待补件"],
        note: "不进入正式摇号，用于演示审核阻断。",
      },
      {
        code: "QX012",
        name: "杨志斌",
        idSuffix: "3395",
        phoneSuffix: "3395",
        qualification: "放弃参与",
        reviewStatus: "本人放弃",
        anomaly: "已签字放弃参与",
        wishes: ["C", "D"],
        address: "清溪花园 12 栋 2 单元 605",
        familyMembers: [
          { name: "杨志斌", relation: "户主" },
          { name: "杨晨悦", relation: "配偶" },
        ],
        proxy: { enabled: false, name: "", relation: "", status: "未使用" },
        tags: ["放弃参与"],
        note: "不进入摇号，用于演示异常名单和锁定前提醒。",
      },
    ],
    "proj-binjiang": [
      {
        code: "BJ001",
        name: "赵成林",
        idSuffix: "3302",
        phoneSuffix: "3302",
        qualification: "有效",
        reviewStatus: "审核通过",
        anomaly: "历史项目已归档",
        wishes: ["A", "B", "C"],
        address: "滨江新苑 1 栋 1 单元 1202",
        familyMembers: [
          { name: "赵成林", relation: "户主" },
          { name: "周雯婷", relation: "配偶" },
        ],
        proxy: { enabled: false, name: "", relation: "", status: "未使用" },
        tags: ["历史查询样例"],
        note: "适合作为已发布项目的查询样例。",
      },
      {
        code: "BJ002",
        name: "吴海燕",
        idSuffix: "4416",
        phoneSuffix: "4416",
        qualification: "有效",
        reviewStatus: "审核通过",
        anomaly: "历史项目已归档",
        wishes: ["A", "C", "D"],
        address: "滨江新苑 2 栋 2 单元 903",
        familyMembers: [
          { name: "吴海燕", relation: "户主" },
          { name: "李志刚", relation: "配偶" },
        ],
        proxy: { enabled: false, name: "", relation: "", status: "未使用" },
        tags: ["已发布结果"],
        note: "已归档项目的 A 轮样例。",
      },
      {
        code: "BJ003",
        name: "冯国强",
        idSuffix: "5524",
        phoneSuffix: "5524",
        qualification: "有效",
        reviewStatus: "审核通过",
        anomaly: "历史项目已归档",
        wishes: ["A", "B", "D"],
        address: "滨江新苑 3 栋 1 单元 501",
        familyMembers: [
          { name: "冯国强", relation: "户主" },
          { name: "陈若溪", relation: "配偶" },
        ],
        proxy: { enabled: false, name: "", relation: "", status: "未使用" },
        tags: ["归档项目"],
        note: "用于对比历史项目与当前项目状态差异。",
      },
      {
        code: "BJ004",
        name: "林秀兰",
        idSuffix: "6635",
        phoneSuffix: "6635",
        qualification: "有效",
        reviewStatus: "审核通过",
        anomaly: "历史项目已归档",
        wishes: ["B", "C", "D"],
        address: "滨江新苑 4 栋 2 单元 1002",
        familyMembers: [
          { name: "林秀兰", relation: "户主" },
          { name: "刘长安", relation: "配偶" },
          { name: "刘子铭", relation: "子女" },
        ],
        proxy: { enabled: false, name: "", relation: "", status: "未使用" },
        tags: ["已归档"],
        note: "B 轮候补顺序展示样例。",
      },
      {
        code: "BJ005",
        name: "蒋和平",
        idSuffix: "7741",
        phoneSuffix: "7741",
        qualification: "有效",
        reviewStatus: "审核通过",
        anomaly: "历史项目已归档",
        wishes: ["B", "D", "C"],
        address: "滨江新苑 5 栋 1 单元 702",
        familyMembers: [
          { name: "蒋和平", relation: "户主" },
          { name: "许春丽", relation: "配偶" },
        ],
        proxy: { enabled: false, name: "", relation: "", status: "未使用" },
        tags: ["归档项目"],
        note: "D 轮流转样例。",
      },
      {
        code: "BJ006",
        name: "朱雪梅",
        idSuffix: "8850",
        phoneSuffix: "8850",
        qualification: "有效",
        reviewStatus: "审核通过",
        anomaly: "历史项目已归档",
        wishes: ["C", "D", "B"],
        address: "滨江新苑 6 栋 2 单元 802",
        familyMembers: [
          { name: "朱雪梅", relation: "户主" },
          { name: "朱昊天", relation: "子女" },
        ],
        proxy: { enabled: false, name: "", relation: "", status: "未使用" },
        tags: ["归档项目"],
        note: "C 轮中签查询样例。",
      },
      {
        code: "BJ007",
        name: "方启明",
        idSuffix: "9963",
        phoneSuffix: "9963",
        qualification: "有效",
        reviewStatus: "审核通过",
        anomaly: "历史项目已归档",
        wishes: ["C", "B", "D"],
        address: "滨江新苑 7 栋 1 单元 601",
        familyMembers: [
          { name: "方启明", relation: "户主" },
          { name: "王可欣", relation: "配偶" },
        ],
        proxy: { enabled: false, name: "", relation: "", status: "未使用" },
        tags: ["归档项目"],
        note: "适合作为未中签查询示例。",
      },
      {
        code: "BJ008",
        name: "彭丽君",
        idSuffix: "1078",
        phoneSuffix: "1078",
        qualification: "有效",
        reviewStatus: "审核通过",
        anomaly: "历史项目已归档",
        wishes: ["D", "C", "B"],
        address: "滨江新苑 8 栋 2 单元 1201",
        familyMembers: [
          { name: "彭丽君", relation: "户主" },
          { name: "曹宇宁", relation: "配偶" },
        ],
        proxy: { enabled: false, name: "", relation: "", status: "未使用" },
        tags: ["历史查询样例"],
        note: "D 轮中签查询样例。",
      },
      {
        code: "BJ009",
        name: "石志勇",
        idSuffix: "2184",
        phoneSuffix: "2184",
        qualification: "有效",
        reviewStatus: "审核通过",
        anomaly: "历史项目已归档",
        wishes: ["A", "D", "C"],
        address: "滨江新苑 9 栋 1 单元 905",
        familyMembers: [
          { name: "石志勇", relation: "户主" },
          { name: "朱清雅", relation: "配偶" },
        ],
        proxy: { enabled: false, name: "", relation: "", status: "未使用" },
        tags: ["归档项目"],
        note: "A 轮未中签后流转到 D 轮。",
      },
      {
        code: "BJ010",
        name: "邱雅琴",
        idSuffix: "3296",
        phoneSuffix: "3296",
        qualification: "有效",
        reviewStatus: "审核通过",
        anomaly: "历史项目已归档",
        wishes: ["B", "C", "A"],
        address: "滨江新苑 10 栋 1 单元 405",
        familyMembers: [
          { name: "邱雅琴", relation: "户主" },
          { name: "邱晨曦", relation: "女儿" },
        ],
        proxy: { enabled: false, name: "", relation: "", status: "未使用" },
        tags: ["归档项目"],
        note: "B 轮样例。",
      },
      {
        code: "BJ011",
        name: "韩瑞芳",
        idSuffix: "4305",
        phoneSuffix: "4305",
        qualification: "有效",
        reviewStatus: "审核通过",
        anomaly: "历史项目已归档",
        wishes: ["C", "D", "A"],
        address: "滨江新苑 11 栋 2 单元 1103",
        familyMembers: [
          { name: "韩瑞芳", relation: "户主" },
          { name: "韩子祺", relation: "子女" },
        ],
        proxy: { enabled: false, name: "", relation: "", status: "未使用" },
        tags: ["归档项目"],
        note: "C 轮参与并进入候补顺序。",
      },
      {
        code: "BJ012",
        name: "谢光杰",
        idSuffix: "5411",
        phoneSuffix: "5411",
        qualification: "有效",
        reviewStatus: "审核通过",
        anomaly: "历史项目已归档",
        wishes: ["D", "B", "C"],
        address: "滨江新苑 12 栋 1 单元 603",
        familyMembers: [
          { name: "谢光杰", relation: "户主" },
          { name: "林若彤", relation: "配偶" },
        ],
        proxy: { enabled: false, name: "", relation: "", status: "未使用" },
        tags: ["归档项目"],
        note: "D 轮未中签并进入待补位队列。",
      },
    ],
  };

  const households = Object.keys(householdSeeds).reduce(function (collection, projectId) {
    return collection.concat(
      householdSeeds[projectId].map(function (seed, index) {
        return createHousehold(projectId, index, seed);
      })
    );
  }, []);

  const wishes = households.map(function (household) {
    return {
      id: "wish-" + household.id,
      projectId: household.projectId,
      householdId: household.id,
      priorities: household.wishes.map(function (type, index) {
        return {
          order: index + 1,
          type: type,
        };
      }),
    };
  });

  const createUnit = function (projectId, index, seed) {
    return {
      id: projectId + "-unit-" + String(index + 1).padStart(2, "0"),
      projectId: projectId,
      code: seed.code,
      type: seed.type,
      building: seed.building,
      unit: seed.unit,
      floor: seed.floor,
      room: seed.room,
      area: seed.area,
      orientation: seed.orientation,
      status: seed.status,
      note: seed.note,
    };
  };

  const unitSeeds = {
    "proj-qingxi": [
      { code: "QX-A-01", type: "A", building: "1 栋", unit: "1 单元", floor: "12F", room: "1201", area: "89㎡", orientation: "南北", status: "可用", note: "A 户型房源池 1" },
      { code: "QX-A-02", type: "A", building: "2 栋", unit: "1 单元", floor: "15F", room: "1502", area: "92㎡", orientation: "南", status: "可用", note: "A 户型房源池 2" },
      { code: "QX-B-01", type: "B", building: "3 栋", unit: "1 单元", floor: "16F", room: "1601", area: "103㎡", orientation: "南北", status: "可用", note: "B 户型房源池 1" },
      { code: "QX-B-02", type: "B", building: "3 栋", unit: "2 单元", floor: "18F", room: "1802", area: "101㎡", orientation: "南", status: "可用", note: "B 户型房源池 2" },
      { code: "QX-C-01", type: "C", building: "4 栋", unit: "1 单元", floor: "9F", room: "0901", area: "118㎡", orientation: "东南", status: "可用", note: "C 户型房源池 1" },
      { code: "QX-C-02", type: "C", building: "4 栋", unit: "2 单元", floor: "11F", room: "1102", area: "121㎡", orientation: "南北", status: "可用", note: "C 户型房源池 2" },
      { code: "QX-D-01", type: "D", building: "5 栋", unit: "1 单元", floor: "8F", room: "0801", area: "134㎡", orientation: "南", status: "可用", note: "D 户型房源池 1" },
      { code: "QX-D-02", type: "D", building: "5 栋", unit: "2 单元", floor: "10F", room: "1001", area: "138㎡", orientation: "南北", status: "可用", note: "D 户型房源池 2" },
    ],
    "proj-binjiang": [
      { code: "BJ-A-01", type: "A", building: "1 栋", unit: "1 单元", floor: "10F", room: "1001", area: "88㎡", orientation: "南北", status: "已归档", note: "历史项目 A 户型" },
      { code: "BJ-A-02", type: "A", building: "2 栋", unit: "1 单元", floor: "12F", room: "1202", area: "90㎡", orientation: "南", status: "已归档", note: "历史项目 A 户型" },
      { code: "BJ-B-01", type: "B", building: "3 栋", unit: "1 单元", floor: "15F", room: "1501", area: "102㎡", orientation: "南北", status: "已归档", note: "历史项目 B 户型" },
      { code: "BJ-B-02", type: "B", building: "3 栋", unit: "2 单元", floor: "16F", room: "1602", area: "104㎡", orientation: "南", status: "已归档", note: "历史项目 B 户型" },
      { code: "BJ-C-01", type: "C", building: "4 栋", unit: "1 单元", floor: "9F", room: "0901", area: "119㎡", orientation: "东南", status: "已归档", note: "历史项目 C 户型" },
      { code: "BJ-C-02", type: "C", building: "4 栋", unit: "2 单元", floor: "11F", room: "1102", area: "122㎡", orientation: "南北", status: "已归档", note: "历史项目 C 户型" },
      { code: "BJ-D-01", type: "D", building: "5 栋", unit: "1 单元", floor: "8F", room: "0801", area: "136㎡", orientation: "南", status: "已归档", note: "历史项目 D 户型" },
      { code: "BJ-D-02", type: "D", building: "5 栋", unit: "2 单元", floor: "9F", room: "0902", area: "139㎡", orientation: "南北", status: "已归档", note: "历史项目 D 户型" },
    ],
  };

  const units = Object.keys(unitSeeds).reduce(function (collection, projectId) {
    return collection.concat(
      unitSeeds[projectId].map(function (seed, index) {
        return createUnit(projectId, index, seed);
      })
    );
  }, []);

  const reviewerByProject = {
    "proj-qingxi": "审核专员 陈倩",
    "proj-binjiang": "审核专员 姚磊",
  };

  const reviewRecords = households.map(function (household, index) {
    return {
      id: "review-" + household.id,
      projectId: household.projectId,
      householdId: household.id,
      reviewer: reviewerByProject[household.projectId],
      status: household.reviewStatus,
      note: household.anomaly,
      updatedAt: household.projectId === "proj-qingxi" ? "2026-05-" + String(6 + (index % 4)).padStart(2, "0") + " 10:3" + (index % 5) : "2025-12-" + String(10 + (index % 6)).padStart(2, "0") + " 09:1" + (index % 5),
    };
  });

  const notificationRecords = [
    { id: "notice-qx-01", projectId: "proj-qingxi", title: "活动通知短信", channel: "短信", status: "已发送", audience: 10, sentAt: "2026-05-08 10:00" },
    { id: "notice-qx-02", projectId: "proj-qingxi", title: "补件提醒短信", channel: "短信", status: "待发送", audience: 2, sentAt: "--" },
    { id: "notice-qx-03", projectId: "proj-qingxi", title: "查询二维码预热", channel: "二维码", status: "已生成", audience: 1, sentAt: "2026-05-10 09:00" },
    { id: "notice-bj-01", projectId: "proj-binjiang", title: "活动通知短信", channel: "短信", status: "已发送", audience: 12, sentAt: "2025-12-12 09:30" },
    { id: "notice-bj-02", projectId: "proj-binjiang", title: "结果发布短信", channel: "短信", status: "已发送", audience: 12, sentAt: "2025-12-20 11:05" },
    { id: "notice-bj-03", projectId: "proj-binjiang", title: "公示结果公告", channel: "公告", status: "已归档", audience: 1, sentAt: "2025-12-21 09:00" },
  ];

  const onsiteCheckins = [
    { id: "check-qx-01", projectId: "proj-qingxi", householdId: "proj-qingxi-household-01", status: "已签到", time: "08:16", operator: "现场服务 01" },
    { id: "check-qx-02", projectId: "proj-qingxi", householdId: "proj-qingxi-household-04", status: "已签到", time: "08:28", operator: "现场服务 02" },
    { id: "check-bj-01", projectId: "proj-binjiang", householdId: "proj-binjiang-household-01", status: "已签到", time: "08:06", operator: "现场服务 01" },
    { id: "check-bj-02", projectId: "proj-binjiang", householdId: "proj-binjiang-household-02", status: "已签到", time: "08:12", operator: "现场服务 01" },
    { id: "check-bj-03", projectId: "proj-binjiang", householdId: "proj-binjiang-household-04", status: "已签到", time: "08:20", operator: "现场服务 02" },
    { id: "check-bj-04", projectId: "proj-binjiang", householdId: "proj-binjiang-household-08", status: "已签到", time: "08:41", operator: "现场服务 03" },
  ];

  const onsiteExceptions = [
    { id: "exception-qx-01", projectId: "proj-qingxi", title: "补件住户提醒", detail: "QX011 委托书附件缺失，需在锁定前完成补录。", status: "待处理" },
    { id: "exception-qx-02", projectId: "proj-qingxi", title: "本人放弃登记", detail: "QX012 已签字放弃参与，保留台账留痕。", status: "已登记" },
    { id: "exception-bj-01", projectId: "proj-binjiang", title: "历史异议已结案", detail: "BJ007 对 C 轮结果提出复核，已在 T+2 完成闭环。", status: "已结案" },
  ];

  window.HousingPrototypeData = {
    version: "1.0.0",
    roundOrder: roundOrder,
    stageTemplates: stageTemplates,
    activityAgenda: activityAgenda,
    documentHighlights: documentHighlights,
    projects: projects,
    households: households,
    wishes: wishes,
    units: units,
    reviewRecords: reviewRecords,
    notificationTemplates: notificationTemplates,
    notificationRecords: notificationRecords,
    onsiteCheckins: onsiteCheckins,
    onsiteExceptions: onsiteExceptions,
  };
})();
