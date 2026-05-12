-- 还房摇号系统 MVP 数据库初始化脚本
-- 适用范围：GitHub Issue #2「创建 MVP 核心表结构和初始化脚本」
-- 数据库：MySQL 8.0+
-- 字符集：utf8mb4
-- 说明：
-- 1. 本脚本面向单项目 MVP，但保留 project_id 以支持后续多项目扩展。
-- 2. 本脚本不是幂等 migration，不建议直接重复执行到已有业务数据的库。
-- 3. 需要重复初始化时，建议先清空测试库或新建数据库后再执行。

CREATE TABLE project (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    name VARCHAR(100) NOT NULL COMMENT '项目名称',
    code VARCHAR(50) NOT NULL COMMENT '项目编码，项目内唯一标识',
    status VARCHAR(20) NOT NULL DEFAULT 'PREPARING' COMMENT '项目状态：PREPARING/LOCKED/LOTTERY/FINISHED/ARCHIVED',
    lottery_date DATE DEFAULT NULL COMMENT '计划摇号日期',
    data_hash CHAR(64) DEFAULT NULL COMMENT '锁定数据快照的 SHA-256 哈希',
    result_published TINYINT(1) NOT NULL DEFAULT 0 COMMENT '结果是否已发布：0=未发布，1=已发布',
    archived_at DATETIME(3) DEFAULT NULL COMMENT '归档时间',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_project_code (code),
    KEY idx_project_status (status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '项目表';

CREATE TABLE household (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    project_id BIGINT NOT NULL COMMENT '所属项目 ID',
    participant_no VARCHAR(20) NOT NULL COMMENT '参与编号，项目内唯一',
    holder_name VARCHAR(50) NOT NULL COMMENT '户主姓名',
    id_card VARCHAR(32) NOT NULL COMMENT '身份证号，MVP 阶段存脱敏/演示数据',
    phone VARCHAR(20) DEFAULT NULL COMMENT '手机号，MVP 阶段存脱敏/演示数据',
    status VARCHAR(20) NOT NULL DEFAULT 'NORMAL' COMMENT '住户状态：NORMAL/DISQUALIFIED/WITHDRAWN',
    member_count INT NOT NULL DEFAULT 1 COMMENT '家庭成员数',
    lottery_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT '摇号状态：PENDING/ENTERED/WON/LOST/VOIDED',
    remarks VARCHAR(255) DEFAULT NULL COMMENT '备注',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_household_project_participant_no (project_id, participant_no),
    KEY idx_household_project_id (project_id),
    KEY idx_household_status (status),
    KEY idx_household_lottery_status (lottery_status),
    CONSTRAINT fk_household_project FOREIGN KEY (project_id) REFERENCES project (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '住户表';

CREATE TABLE housing_unit (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    project_id BIGINT NOT NULL COMMENT '所属项目 ID',
    unit_code VARCHAR(50) NOT NULL COMMENT '房源编号，项目内唯一',
    house_type VARCHAR(10) NOT NULL COMMENT '房型：A/B/C/D',
    building VARCHAR(50) DEFAULT NULL COMMENT '楼栋',
    unit_no VARCHAR(50) DEFAULT NULL COMMENT '单元',
    floor INT DEFAULT NULL COMMENT '楼层',
    room_no VARCHAR(50) DEFAULT NULL COMMENT '房号',
    area DECIMAL(8,2) DEFAULT NULL COMMENT '建筑面积',
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' COMMENT '房源状态：AVAILABLE/RESERVED/ASSIGNED',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '稳定排序号，用于房源分配顺序',
    remarks VARCHAR(255) DEFAULT NULL COMMENT '备注',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_unit_project_unit_code (project_id, unit_code),
    KEY idx_unit_project_id (project_id),
    KEY idx_unit_house_type (house_type),
    KEY idx_unit_status (status),
    KEY idx_unit_project_type_status (project_id, house_type, status),
    CONSTRAINT fk_unit_project FOREIGN KEY (project_id) REFERENCES project (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '房源表';

CREATE TABLE wish (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    household_id BIGINT NOT NULL COMMENT '住户 ID',
    priority INT NOT NULL COMMENT '志愿顺序：1~4',
    house_type VARCHAR(10) NOT NULL COMMENT '房型：A/B/C/D',
    is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否当前有效志愿：1=是，0=否',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_wish_household_priority (household_id, priority),
    UNIQUE KEY uk_wish_household_house_type (household_id, house_type),
    KEY idx_wish_active (is_active),
    CONSTRAINT fk_wish_household FOREIGN KEY (household_id) REFERENCES household (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '住户房型意愿表';

CREATE TABLE lottery_round (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    project_id BIGINT NOT NULL COMMENT '所属项目 ID',
    round_order INT NOT NULL COMMENT '轮次序号：1(A)/2(B)/3(C)/4(D)',
    house_type VARCHAR(10) NOT NULL COMMENT '本轮房型：A/B/C/D',
    candidate_count INT NOT NULL DEFAULT 0 COMMENT '本轮候选住户数',
    winner_count INT NOT NULL DEFAULT 0 COMMENT '本轮中签数',
    seed VARCHAR(64) DEFAULT NULL COMMENT '本轮随机种子',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT '轮次状态：PENDING/RUNNING/COMPLETED/VOIDED',
    started_at DATETIME(3) DEFAULT NULL COMMENT '开始时间',
    finished_at DATETIME(3) DEFAULT NULL COMMENT '完成时间',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_round_project_order (project_id, round_order),
    UNIQUE KEY uk_round_project_house_type (project_id, house_type),
    KEY idx_round_project_id (project_id),
    KEY idx_round_status (status),
    CONSTRAINT fk_round_project FOREIGN KEY (project_id) REFERENCES project (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '摇号轮次表';

CREATE TABLE lottery_result (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    project_id BIGINT NOT NULL COMMENT '所属项目 ID，便于项目维度查询与审计',
    round_id BIGINT NOT NULL COMMENT '所属轮次 ID',
    household_id BIGINT NOT NULL COMMENT '住户 ID',
    assigned_unit_id BIGINT DEFAULT NULL COMMENT '分配到的具体房源 ID，中签时必填',
    result VARCHAR(20) NOT NULL COMMENT '结果：WON/LOST/NOT_ENTERED/VOIDED',
    sort_order INT NOT NULL COMMENT '洗牌后的顺序号，可用于候补顺序',
    is_current TINYINT(1) NOT NULL DEFAULT 1 COMMENT '当前是否为有效结果：1=有效，0=已被作废/替换',
    voided_from_result_id BIGINT DEFAULT NULL COMMENT '若因重摇产生新记录，指向被作废的旧结果 ID',
    remarks VARCHAR(255) DEFAULT NULL COMMENT '备注',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_result_round_household_current (round_id, household_id, is_current),
    KEY idx_result_project_id (project_id),
    KEY idx_result_round_id (round_id),
    KEY idx_result_household_id (household_id),
    KEY idx_result_assigned_unit_id (assigned_unit_id),
    KEY idx_result_result (result),
    CONSTRAINT fk_result_project FOREIGN KEY (project_id) REFERENCES project (id),
    CONSTRAINT fk_result_round FOREIGN KEY (round_id) REFERENCES lottery_round (id),
    CONSTRAINT fk_result_household FOREIGN KEY (household_id) REFERENCES household (id),
    CONSTRAINT fk_result_unit FOREIGN KEY (assigned_unit_id) REFERENCES housing_unit (id),
    CONSTRAINT fk_result_voided_from FOREIGN KEY (voided_from_result_id) REFERENCES lottery_result (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '摇号结果表';

CREATE TABLE audit_log (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    project_id BIGINT NOT NULL COMMENT '所属项目 ID',
    action VARCHAR(50) NOT NULL COMMENT '操作类型，例如 LOCK_DATA/START_ROUND/FINISH_ROUND/VOID_ROUND/EXPORT_RESULT',
    operator VARCHAR(50) NOT NULL COMMENT '操作人',
    detail JSON NOT NULL COMMENT '操作详情 JSON',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '操作时间',
    PRIMARY KEY (id),
    KEY idx_audit_project_id (project_id),
    KEY idx_audit_action (action),
    KEY idx_audit_created_at (created_at),
    CONSTRAINT fk_audit_project FOREIGN KEY (project_id) REFERENCES project (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '审计日志表';
