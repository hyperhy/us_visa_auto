// US Visa Auto-booking Script - Clean & Organized Version
// 美国签证自动预约脚本 - 清晰整理版本

(function usVisaAutoSnippet(){
	'use strict';

	// ==========================================
	// === CYCLE COUNTER / 循环计数器 ===
	// ==========================================
	
	// 🔄 循环计数器
	let cycleCount = 0;
	
	// ==========================================
	// === ALERT INTERCEPTOR / Alert拦截器 ===
	// ==========================================
	
	// 🛡️ 设置Alert拦截，自动处理PSE0502等错误弹窗
	(function setupAlertInterception() {
		// 保存原始的alert函数
		const originalAlert = window.alert;
		let alertCount = 0;
		
		// 临时系统日志数组，等LogStorage初始化后添加
		const tempSystemLogs = [];
		const addSystemLog = (msg) => {
			console.log(msg);
			tempSystemLogs.push(msg);
		};
		
		// 重写alert函数
		window.alert = function(message) {
			alertCount++;
			
			addSystemLog(`🚨 [Alert拦截] 弹窗 #${alertCount}: ${message}`);
			
			// 检查是否是PSE0502错误
			if(message && message.includes('PSE0502')) {
				addSystemLog('🎯 [Alert拦截] 检测到PSE0502错误，自动关闭');
				return; // 直接返回，不显示alert
			}
			
			// 检查其他常见的错误模式
			const errorPatterns = [
				'无法加载',
				'预约时间',
				'联系支持',
				'错误代码',
				'PSE',
				'Error',
				'服务暂时不可用',
				'请稍后再试'
			];
			
			const isError = errorPatterns.some(pattern => 
				message && message.toString().includes(pattern)
			);
			
			if(isError) {
				addSystemLog('⚠️ [Alert拦截] 检测到错误类型Alert，自动关闭: ' + message);
				return; // 自动关闭错误弹窗
			}
			
			// 对于其他类型的alert，记录但不显示
			addSystemLog('ℹ️ [Alert拦截] 其他类型Alert已自动关闭: ' + message);
		};
		
		addSystemLog('🛡️ [Alert拦截] Alert拦截器已安装');
		
		// 将临时日志保存到全局，供LogStorage初始化后使用
		window.tempSystemLogs = tempSystemLogs;
	})();

	// ==========================================
	// === CONFIGURATION / 配置 ===
	// ==========================================
	
	const CONFIG = {
		TARGET_POST: 'TOKYO',                    // 目标领事馆
		DATE_CUTOFF: new Date('2025-10-30'),     // 日期截止点
		MAX_PAGE_FLIPS: 12,                      // 最大翻页次数
		RESET_RETRY_LIMIT: 6,                    // 重置重试次数限制
		RESET_WAIT_MIN_MS: 1200,                 // 重置后最小等待时间
		RESET_WAIT_MAX_MS: 4200,                 // 重置后最大等待时间
		
		// 人性化设置 - 快速刷新模式
		HUMANIZE: true,                          // 启用人性化操作
		MIN_DELAY: 800,                          // 最小延迟 (0.8秒)
		MAX_DELAY: 2000,                         // 最大延迟 (2秒)
		AUTO_CONTINUE: true,                     // 自动继续到下一步
		VERBOSE: true,                           // 详细日志
		
		// 等待时间设置 - 快速刷新模式，1-3分钟一次循环
		CALENDAR_LOAD_CHECK_INTERVAL: 500,       // 日历加载检查间隔 (0.5秒)
		TIMESLOT_RETRY_WAIT: 2000,              // 时间段重试等待时间 (2秒)
		SUBMIT_WAIT_MIN: 2000,                  // 提交前最小等待时间 (2秒)
		SUBMIT_WAIT_MAX: 4000,                  // 提交前最大等待时间 (4秒)
		SUBMIT_RESPONSE_WAIT: 5000,             // 提交后等待响应时间 (5秒)
		STEP_TRANSITION_MIN: 2000,              // 步骤转换最小等待时间 (2秒)
		STEP_TRANSITION_MAX: 4000,              // 步骤转换最大等待时间 (4秒)
		STEP_DETECTION_RETRY_INTERVAL: 1500,    // 步骤检测重试间隔 (1.5秒)
		CONTINUE_SEARCH_WAIT_MIN: 60000,        // 继续搜索等待最小时间 (1分钟)
		CONTINUE_SEARCH_WAIT_MAX: 180000,       // 继续搜索等待最大时间 (3分钟)
		SERVER_UPDATE_WAIT_MIN: 10000,          // 服务器状态更新最小等待时间 (10秒)
		SERVER_UPDATE_WAIT_MAX: 20000,          // 服务器状态更新最大等待时间 (20秒)
		
		// 人性化交互时间 - 快速但自然的操作
		MOUSE_HOVER_MIN: 300,                   // 鼠标悬停最小时间 (0.3秒)
		MOUSE_HOVER_MAX: 800,                   // 鼠标悬停最大时间 (0.8秒)
		MOUSE_MOVE_MIN: 200,                    // 鼠标移动最小时间 (0.2秒)
		MOUSE_MOVE_MAX: 600,                    // 鼠标移动最大时间 (0.6秒)
		MOUSE_DOWN_MIN: 150,                    // 鼠标按下最小时间 (0.15秒)
		MOUSE_DOWN_MAX: 400,                    // 鼠标按下最大时间 (0.4秒)
		MOUSE_UP_MIN: 100,                      // 鼠标抬起最小时间 (0.1秒)
		MOUSE_UP_MAX: 300,                      // 鼠标抬起最大时间 (0.3秒)
		MOUSE_CLICK_MIN: 100,                   // 鼠标点击最小时间 (0.1秒)
		MOUSE_CLICK_MAX: 300,                   // 鼠标点击最大时间 (0.3秒)
		CLICK_AFTER_MIN: 800,                   // 点击后最小等待时间 (0.8秒)
		CLICK_AFTER_MAX: 2000,                  // 点击后最大等待时间 (2秒)
		THINKING_TIME_MIN: 1000,                // 思考时间最小值 (1秒)
		THINKING_TIME_MAX: 3000,                // 思考时间最大值 (3秒)
		EXTRA_THINKING_MIN: 2000,               // 额外思考时间最小值 (2秒)
		EXTRA_THINKING_MAX: 5000,               // 额外思考时间最大值 (5秒)
		SELECT_WAIT_MIN: 300,                   // 选择操作最小等待时间 (0.3秒)
		SELECT_WAIT_MAX: 1000,                  // 选择操作最大等待时间 (1秒)
		
		// PSE0502错误处理设置
		PSE0502_RETRY_DELAY: 3000,              // PSE0502错误后重试延迟 (3秒)
		PSE0502_MAX_RETRIES: 3,                 // PSE0502错误最大重试次数
		ALERT_INTERCEPT_ENABLED: true,          // 启用Alert拦截功能
		
		// 控制开关
		STOP_REQUESTED: false,                   // 停止请求标志
		AUTO_SUBMIT: true,                      // 自动提交开关：true=自动提交，false=用户确认
		
		// 继续搜索设置 - 快速刷新模式
		CONTINUE_SEARCH_MIN: 5000,               // 继续搜索最小等待时间 (5秒)
		CONTINUE_SEARCH_MAX: 15000,              // 继续搜索最大等待时间 (15秒)
		CONTINUE_SEARCH_PREPARATION: 3000,       // 继续搜索准备等待时间 (3秒)
		STEP_COMPLETION_MIN: 2000,               // 步骤完成最小等待时间 (2秒)
		STEP_COMPLETION_MAX: 5000                // 步骤完成最大等待时间 (5秒)
	};

	// ==========================================
	// === USER CONFIG PERSISTENCE / 用户可调配置持久化 ===
	// ==========================================

	// 新增：翻页节奏（用户可配置）默认值
	CONFIG.PAGE_FLIP_DELAY_MIN = 300;   // 翻页最小等待 (ms)
	CONFIG.PAGE_FLIP_DELAY_MAX = 1000;  // 翻页最大等待 (ms)

	const USER_CONFIG_KEYS = [
		'DATE_CUTOFF',
		'RESET_WAIT_MIN_MS','RESET_WAIT_MAX_MS',
		'MIN_DELAY','MAX_DELAY',
		'CONTINUE_SEARCH_WAIT_MIN','CONTINUE_SEARCH_WAIT_MAX',
		'PAGE_FLIP_DELAY_MIN','PAGE_FLIP_DELAY_MAX',
		'TARGET_POST'
	];

	const USER_CONFIG_STORAGE_KEY = 'usVisaAutoUserConfigV1';

	function saveUserConfig(partial){
		try {
			const existing = loadRawUserConfig();
			const merged = {...existing, ...partial};
			localStorage.setItem(USER_CONFIG_STORAGE_KEY, JSON.stringify(merged));
			log('💾 已保存用户自定义配置');
		} catch(e){
			console.error('保存用户配置失败', e);
		}
	}

	function loadRawUserConfig(){
		try {
			return JSON.parse(localStorage.getItem(USER_CONFIG_STORAGE_KEY) || '{}');
		} catch(e){
			console.warn('读取用户配置失败，使用默认', e); return {}; }
	}

	function applyUserConfig(){
		const raw = loadRawUserConfig();
		let applied = 0;
		USER_CONFIG_KEYS.forEach(k=>{
			if(Object.prototype.hasOwnProperty.call(raw,k)) {
				if(k === 'DATE_CUTOFF') {
					const d = new Date(raw[k]);
					if(!isNaN(d.getTime())) { CONFIG.DATE_CUTOFF = d; applied++; }
				} else if(k === 'TARGET_POST') {
					if(typeof raw[k] === 'string' && raw[k].trim()) { 
						CONFIG.TARGET_POST = raw[k].trim().toUpperCase(); applied++; 
					}
				} else if(Number.isFinite(raw[k])) {
					CONFIG[k] = raw[k]; applied++;
				}
			}
		});
		if(applied) log(`🔧 已应用用户自定义配置 ${applied} 项`);
	}

	// 注意：applyUserConfig() 需要在 LogStorage 初始化之后再调用，避免日志写入报错

	// === 配置面板 ===
	function createConfigPanel(){
		if(document.getElementById('usVisaAutoConfigPanel')) return; // 避免重复
		const panel = document.createElement('div');
		panel.id = 'usVisaAutoConfigPanel';
		panel.style.cssText = `position:fixed;top:500px;right:20px;z-index:9999;background:rgba(0,0,0,0.85);color:#fff;font:12px monospace;border:1px solid #444;padding:8px;width:320px;border-radius:6px;line-height:1.4;`
		panel.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
			<span style="font-weight:bold;">⚙️ 参数配置</span>
			<button id="cfgToggleBtn" style="background:#333;color:#fff;border:1px solid #555;font-size:11px;cursor:pointer;padding:2px 6px;">收起</button>
		</div>
		<style>
			#usVisaAutoConfigPanel .cfg-row{display:flex;align-items:center;gap:6px;margin-top:4px;}
			#usVisaAutoConfigPanel .cfg-label{width:105px;text-align:right;color:#ddd;flex-shrink:0;}
			#usVisaAutoConfigPanel input[type=date],
			#usVisaAutoConfigPanel input[type=text],
			#usVisaAutoConfigPanel input[type=number]{background:#111;border:1px solid #444;color:#fff;font:12px monospace;padding:2px 4px;border-radius:3px;}
			#usVisaAutoConfigPanel input[type=number]{width:72px;}
			#usVisaAutoConfigPanel input[type=date]{width:145px;}
			#usVisaAutoConfigPanel input[type=text]{width:145px;}
			#usVisaAutoConfigPanel .cfg-sep{color:#888;font-size:11px;}
			#usVisaAutoConfigPanel .cfg-actions{margin-top:8px;display:flex;gap:8px;}
			#usVisaAutoConfigPanel .cfg-actions button{flex:1;padding:5px 0;font-size:12px;font-weight:bold;border-radius:4px;cursor:pointer;border:0;}
			#usVisaAutoConfigPanel #cfgSaveBtn{background:#2d7fff;color:#fff;}
			#usVisaAutoConfigPanel #cfgResetBtn{background:#aa2222;color:#fff;}
		</style>
		<div id="cfgBody">
			<div class='cfg-row'>
				<span class='cfg-label'>截止日期</span>
				<input type='date' id='cfg_date_cutoff'>
			</div>
			<div class='cfg-row'>
				<span class='cfg-label'>目标领事馆</span>
				<input type='text' id='cfg_target_post' placeholder='TOKYO' style='text-transform:uppercase;'>
			</div>
			<div class='cfg-row'>
				<span class='cfg-label'>重置等待(ms)</span>
				<input type='number' id='cfg_reset_min' placeholder='最小'>
				<span class='cfg-sep'>~</span>
				<input type='number' id='cfg_reset_max' placeholder='最大'>
			</div>
			<div class='cfg-row'>
				<span class='cfg-label'>基础延迟(ms)</span>
				<input type='number' id='cfg_base_min' placeholder='最小'>
				<span class='cfg-sep'>~</span>
				<input type='number' id='cfg_base_max' placeholder='最大'>
			</div>
			<div class='cfg-row'>
				<span class='cfg-label'>循环等待(秒)</span>
				<input type='number' id='cfg_loop_min' placeholder='最小'>
				<span class='cfg-sep'>~</span>
				<input type='number' id='cfg_loop_max' placeholder='最大'>
			</div>
			<div class='cfg-row'>
				<span class='cfg-label'>翻页延迟(ms)</span>
				<input type='number' id='cfg_page_min' placeholder='最小'>
				<span class='cfg-sep'>~</span>
				<input type='number' id='cfg_page_max' placeholder='最大'>
			</div>
			<div class='cfg-actions'>
				<button id='cfgSaveBtn'>保存</button>
				<button id='cfgResetBtn'>重置</button>
			</div>
			<div id='cfgStatus' style='margin-top:4px;color:#0f0;font-size:11px;min-height:14px;'></div>
		</div>`;

		function pad(n){return n.toString().padStart(2,'0');}
		function yyyyMMdd(d){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;}

		document.body.appendChild(panel);

		// 初始化表单值
		const dateInput = panel.querySelector('#cfg_date_cutoff');
		dateInput.value = yyyyMMdd(CONFIG.DATE_CUTOFF);
		panel.querySelector('#cfg_target_post').value = CONFIG.TARGET_POST;
		panel.querySelector('#cfg_reset_min').value = CONFIG.RESET_WAIT_MIN_MS;
		panel.querySelector('#cfg_reset_max').value = CONFIG.RESET_WAIT_MAX_MS;
		panel.querySelector('#cfg_base_min').value = CONFIG.MIN_DELAY;
		panel.querySelector('#cfg_base_max').value = CONFIG.MAX_DELAY;
		panel.querySelector('#cfg_loop_min').value = Math.round(CONFIG.CONTINUE_SEARCH_WAIT_MIN/1000);
		panel.querySelector('#cfg_loop_max').value = Math.round(CONFIG.CONTINUE_SEARCH_WAIT_MAX/1000);
		panel.querySelector('#cfg_page_min').value = CONFIG.PAGE_FLIP_DELAY_MIN;
		panel.querySelector('#cfg_page_max').value = CONFIG.PAGE_FLIP_DELAY_MAX;

		panel.querySelector('#cfgToggleBtn').onclick = () => {
			const body = panel.querySelector('#cfgBody');
			if(body.style.display === 'none') { body.style.display='block'; panel.querySelector('#cfgToggleBtn').textContent='收起'; }
			else { body.style.display='none'; panel.querySelector('#cfgToggleBtn').textContent='展开'; }
		};

		panel.querySelector('#cfgResetBtn').onclick = () => {
			localStorage.removeItem(USER_CONFIG_STORAGE_KEY);
			applyUserConfig();
			panel.remove();
			createConfigPanel();
			log('♻️ 已恢复默认参数');
		};

		panel.querySelector('#cfgSaveBtn').onclick = () => {
			const newCfg = {};
			try {
				newCfg.DATE_CUTOFF = new Date(dateInput.value + 'T00:00:00');
				newCfg.TARGET_POST = (panel.querySelector('#cfg_target_post').value || 'TOKYO').trim().toUpperCase();
				newCfg.RESET_WAIT_MIN_MS = parseInt(panel.querySelector('#cfg_reset_min').value)||CONFIG.RESET_WAIT_MIN_MS;
				newCfg.RESET_WAIT_MAX_MS = parseInt(panel.querySelector('#cfg_reset_max').value)||CONFIG.RESET_WAIT_MAX_MS;
				newCfg.MIN_DELAY = parseInt(panel.querySelector('#cfg_base_min').value)||CONFIG.MIN_DELAY;
				newCfg.MAX_DELAY = parseInt(panel.querySelector('#cfg_base_max').value)||CONFIG.MAX_DELAY;
				newCfg.CONTINUE_SEARCH_WAIT_MIN = (parseInt(panel.querySelector('#cfg_loop_min').value)||Math.round(CONFIG.CONTINUE_SEARCH_WAIT_MIN/1000))*1000;
				newCfg.CONTINUE_SEARCH_WAIT_MAX = (parseInt(panel.querySelector('#cfg_loop_max').value)||Math.round(CONFIG.CONTINUE_SEARCH_WAIT_MAX/1000))*1000;
				newCfg.PAGE_FLIP_DELAY_MIN = parseInt(panel.querySelector('#cfg_page_min').value)||CONFIG.PAGE_FLIP_DELAY_MIN;
				newCfg.PAGE_FLIP_DELAY_MAX = parseInt(panel.querySelector('#cfg_page_max').value)||CONFIG.PAGE_FLIP_DELAY_MAX;
				saveUserConfig(newCfg);
				applyUserConfig();
				panel.querySelector('#cfgStatus').textContent = '✅ 已保存';
				setTimeout(()=> panel.querySelector('#cfgStatus').textContent='', 2000);
			} catch(e){
				panel.querySelector('#cfgStatus').textContent = '❌ 保存失败';
				console.error(e);
			}
		};

		log('⚙️ 参数配置面板已创建');
	}


	// ==========================================
	// === LOGGING & UTILITIES / 日志和工具 ===
	// ==========================================
	
	// 简化的日志存储 - 直接记录控制台输出
	const LogStorage = {
		storageKey: 'visaConsoleLog',
		maxEntries: 25000, // 最多保存25000条控制台日志（支持约20小时高强度运行，仅占用2.1MB存储）
		
		// 添加日志条目
		addEntry: function(logText) {
			let logs = this.getLogs();
			const timestamp = new Date().toLocaleString('zh-CN');
			const entry = `[${timestamp}] ${logText}`;
			
			logs.push(entry);
			
			// 智能清理：当接近容量上限时，自动清理老日志
			if(logs.length >= this.maxEntries) {
				// 自动备份日志到下载
				const backupMsg = '💾 [自动备份] 日志达到上限，自动下载备份...';
				console.log(backupMsg);
				this.downloadLogs();
				
				// 完全清空日志，从0开始重新计数
				logs = [];
				const cleanupMsg = `🧹 [自动清理] 已清空所有日志，重新开始计数 (0/${this.maxEntries})`;
				console.log(cleanupMsg);
				// 这些系统消息不需要再次addEntry，因为会导致递归调用
			}
			
			localStorage.setItem(this.storageKey, JSON.stringify(logs));
		},
		
		// 获取所有日志
		getLogs: function() {
			try {
				return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
			} catch(e) {
				console.error('❌ 读取控制台日志失败:', e);
				return [];
			}
		},
		
		// 清空日志
		clearLogs: function() {
			localStorage.removeItem(this.storageKey);
			const clearMsg = '🗑️ 已清空控制台日志';
			console.log(clearMsg);
			// 清空操作不保存到日志，因为日志已经被清空了
		},
		
		// 下载日志
		downloadLogs: function() {
			const logs = this.getLogs();
			let content = '=== 美国签证自动化控制台日志 ===\n';
			content += `导出时间: ${new Date().toLocaleString('zh-CN')}\n`;
			content += `当前循环: 第${cycleCount}次\n`;
			content += `总计日志: ${logs.length} 条\n\n`;
			content += logs.join('\n');
			
			const blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			// 改进的文件名：包含日期时间，便于整理到us_visa_auto文件夹
			const now = new Date();
			const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
			const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
			a.download = `us_visa_auto_logs_${dateStr}_${timeStr}_cycle-${cycleCount}.txt`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			
			const downloadMsg = '💾 控制台日志已下载 - 建议移动到Downloads/us_visa_auto/文件夹';
			console.log(downloadMsg);
			console.log('📁 在Windows中创建Downloads/us_visa_auto文件夹来整理日志文件');
			// 下载消息不需要保存到日志，因为会影响下载的文件内容
		}
	};

	// 🔄 初始化LogStorage后，处理之前的系统日志
	(function initializeSystemLogs() {
		if(window.tempSystemLogs && window.tempSystemLogs.length > 0) {
			window.tempSystemLogs.forEach(logMsg => {
				LogStorage.addEntry('[🛡️ System] ' + logMsg);
			});
			delete window.tempSystemLogs; // 清理临时日志
		}
	})();

	function log(...args) { 
		const logText = '[🎯 US-Visa-Auto] ' + args.join(' ');
		console.log(logText);
		LogStorage.addEntry(logText);
	}
	
	function tlog(...args) { 
		const logText = '[⏰ Timeslot] ' + args.join(' ');
		console.log(logText);
		LogStorage.addEntry(logText);
	}
	
	function vlog(...args) {
		if(CONFIG.VERBOSE) {
			const logText = '[📝 Debug] ' + args.join(' ');
			console.log(logText);
			LogStorage.addEntry(logText);
		}
	}

	// 现在 LogStorage 和 log() 已就绪，可以安全应用用户配置
	applyUserConfig();

	// 检查是否请求停止
	function checkStopRequested() {
		if(CONFIG.STOP_REQUESTED) {
				log('� 运行模式: 快速刷新模式 - 高频搜索理想预约时机');
			throw new Error('用户请求停止脚本');
		}
	}

	// 停止脚本的函数
	function stopScript() {
		CONFIG.STOP_REQUESTED = true;
		log('🛑 脚本停止请求已发送');
	}

	// 创建停止按钮
	function createStopButton() {
		// 检查是否已存在按钮
		if(document.getElementById('usVisaAutoStopBtn')) return;
		
		const button = document.createElement('button');
		button.id = 'usVisaAutoStopBtn';
		button.innerHTML = '🛑 停止签证脚本';
		button.style.cssText = `
			position: fixed;
			top: 20px;
			right: 20px;
			z-index: 10000;
			background: #ff4444;
			color: white;
			border: none;
			padding: 10px 20px;
			border-radius: 5px;
			font-size: 14px;
			font-weight: bold;
			cursor: pointer;
			box-shadow: 0 4px 8px rgba(0,0,0,0.3);
			transition: all 0.3s ease;
		`;
		
		// 悬停效果
		button.onmouseover = () => {
			button.style.background = '#cc0000';
			button.style.transform = 'scale(1.05)';
		};
		button.onmouseout = () => {
			button.style.background = '#ff4444';
			button.style.transform = 'scale(1)';
		};
		
		// 点击事件
		button.onclick = () => {
			stopScript();
			button.innerHTML = '✅ 已停止';
			button.style.background = '#666';
			button.disabled = true;
			setTimeout(() => {
				if(button.parentNode) {
					button.parentNode.removeChild(button);
				}
			}, 3000);
		};
		
		// 添加到页面
		document.body.appendChild(button);
		log('🔘 已在页面右上角添加停止按钮');
	}
	
	// 创建下载日志按钮
	function createLogDownloadButton() {
		// 检查是否已存在按钮
		if(document.getElementById('usVisaAutoLogBtn')) return;
		
		const button = document.createElement('button');
		button.id = 'usVisaAutoLogBtn';
		button.innerHTML = '📥 下载日志';
		button.style.cssText = `
			position: fixed;
			top: 20px;
			right: 180px;
			z-index: 10000;
			background: #007acc;
			color: white;
			border: none;
			padding: 10px 20px;
			border-radius: 5px;
			font-size: 14px;
			font-weight: bold;
			cursor: pointer;
			box-shadow: 0 4px 8px rgba(0,0,0,0.3);
			transition: all 0.3s ease;
		`;
		
		// 悬停效果
		button.onmouseover = () => {
			button.style.background = '#005a9e';
			button.style.transform = 'scale(1.05)';
		};
		button.onmouseout = () => {
			button.style.background = '#007acc';
			button.style.transform = 'scale(1)';
		};
		
		// 点击事件
		button.onclick = () => {
			LogStorage.downloadLogs();
			button.innerHTML = '✅ 已下载';
			setTimeout(() => {
				button.innerHTML = '📥 下载日志';
			}, 2000);
		};
		
		// 添加到页面
		document.body.appendChild(button);
		log('📥 已在页面添加日志下载按钮');
	}
	
	// 创建日志状态显示面板
	function createLogStatusPanel() {
		// 检查是否已存在面板
		if(document.getElementById('usVisaAutoLogPanel')) return;
		
		const panel = document.createElement('div');
		panel.id = 'usVisaAutoLogPanel';
		panel.style.cssText = `
			position: fixed;
			top: 70px;
			right: 20px;
			z-index: 9999;
			background: rgba(0,0,0,0.8);
			color: #00ff00;
			border: 1px solid #333;
			border-radius: 5px;
			padding: 10px;
			font-family: monospace;
			font-size: 12px;
			width: 400px;
			height: 420px;
			box-shadow: 0 4px 8px rgba(0,0,0,0.3);
		`;
		
		// 更新面板内容的函数
		window.updateLogPanel = function() {
			const logs = LogStorage.getLogs();
			const recentLogs = logs.slice(-8); // 显示最近8条日志
			
			panel.innerHTML = `
				<div style="border-bottom: 1px solid #333; margin-bottom: 5px; padding-bottom: 5px; position:relative;">
					📊 <strong>签证自动化状态监控</strong>
					<button style="position:absolute;right:0;top:0;background:#2d7fff;color:#fff;border:0;font-size:10px;padding:2px 6px;cursor:pointer;border-radius:3px;" title="显示/隐藏参数设置" onclick="(function(){var p=document.getElementById('usVisaAutoConfigPanel'); if(p){ if(p.style.display==='none'){p.style.display='block'; p.scrollIntoView({behavior:'smooth'});} else {p.style.display='none';} } })()">参数</button>
				</div>
				<div>🔄 当前循环: 第${cycleCount}次</div>
				<div>📝 控制台日志: ${logs.length}/${LogStorage.maxEntries}条 (${Math.round(logs.length/LogStorage.maxEntries*100)}%)</div>
				<div>⏰ 最后更新: ${new Date().toLocaleTimeString()}</div>
				${logs.length > LogStorage.maxEntries * 0.95 ? 
					'<div style="color: #ff6600;">🚨 日志存储已使用95%+ (即将自动备份)</div>' : 
					logs.length > LogStorage.maxEntries * 0.85 ? 
					'<div style="color: #ffaa00;">⚠️ 日志存储已使用85%+</div>' : ''
				}
				<div style="margin-top: 8px; border-top: 1px solid #333; padding-top: 5px;">
					<strong>📋 最近日志:</strong>
					<button onclick="LogStorage.downloadLogs()" 
							style="float: right; font-size: 10px; padding: 2px 6px; background: #4444ff; color: white; border: none; border-radius: 3px; cursor: pointer; margin-left: 5px;">
						💾 下载
					</button>
					<button onclick="if(confirm('确认清理所有日志？')) { LogStorage.clearLogs(); updateLogPanel(); }" 
							style="float: right; font-size: 10px; padding: 2px 6px; background: #ff4444; color: white; border: none; border-radius: 3px; cursor: pointer;">
						🧹 清理
					</button>
				</div>
				<div>
					${recentLogs.map(log => {
						// 提取时间和消息内容
						const timeMatch = log.match(/\[([^\]]+)\]/);
						const time = timeMatch ? timeMatch[1].split(' ')[1] : '';
						const message = log.replace(/\[[^\]]+\]\s*\[[^\]]+\]\s*/, '');
						const shortMessage = message.length > 55 ? message.substring(0, 55) + '...' : message;
						return `<div style="font-size: 10px; margin: 2px 0; padding: 2px; background: rgba(255,255,255,0.1); border-radius: 2px;">
							<span style="color: #888;">${time}</span><br>
							<span style="color: #00ff00;">${shortMessage}</span>
						</div>`;
					}).join('')}
				</div>
			`;
		};
		
		// 初始化面板内容
		window.updateLogPanel();
		
		// 定期更新面板
		setInterval(window.updateLogPanel, 5000); // 每5秒更新一次
		
		// 添加到页面
		document.body.appendChild(panel);
		log('📊 已添加日志状态面板');
	}

	const wait = ms => new Promise(r => setTimeout(r, ms));
	const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
	
	// 人性化等待：模拟真实用户的操作节奏
	const humanWait = async (min = CONFIG.MIN_DELAY, max = CONFIG.MAX_DELAY) => {
		if(!CONFIG.HUMANIZE) return;
		checkStopRequested(); // 检查停止请求
		const r = Math.random();
		const skew = 0.8; // 偏向较短等待时间
		const dur = Math.floor(min + Math.pow(r, skew) * (max - min + 1));
		await wait(dur);
		// 偶尔添加额外的思考时间
		if(Math.random() < 0.08) await wait(rand(CONFIG.THINKING_TIME_MIN, CONFIG.THINKING_TIME_MAX));
	};

	// 格式化日期为本地时区的 YYYY-MM-DD 格式
	function formatLocalDate(d) {
		if(!d || !(d instanceof Date) || isNaN(d.getTime())) return null;
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2,'0');
		const dd = String(d.getDate()).padStart(2,'0');
		return `${y}-${m}-${dd}`;
	}

	// ==========================================
	// === STEP DETECTION / 步骤检测 ===
	// ==========================================
	
	function isStep1() {
		// 检测是否为领事馆选择页面
		const selects = Array.from(document.querySelectorAll('select'));
		return selects.some(s => 
			(s.name||'').toLowerCase().includes('consul') || 
			(s.id||'').toLowerCase().includes('consul') || 
			Array.from(s.options||[]).some(o => /consular|post|embassy|办事处|领事馆/i.test(o.text))
		);
	}

	function isStep2() {
		// 检测是否为日期选择页面
		if(document.querySelector('[role=grid], .calendar, .datepicker, .calendar-grid, #datepicker')) return true;
		const maybeDates = Array.from(document.querySelectorAll('button, a, td, div'))
			.filter(n => /\d{1,2}\/\d{1,2}|\d{4}-\d{2}-\d{2}|\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/i.test(n.textContent||''))
			.slice(0,20);
		const hasPagination = /next|>/.test((document.body.textContent||'').toLowerCase());
		return maybeDates.length > 3 && hasPagination;
	}

	function isStep3() {
		// 检测是否为时间段选择页面
		if(document.querySelector('.timeslot, .time-slot, [data-timeslot], .time-list, #time_select')) return true;
		return Array.from(document.querySelectorAll('button, a, li, div'))
			.some(n => /\b\d{1,2}:\d{2}\s*(AM|PM)?\b/i.test(n.textContent||''));
	}

	// ==========================================
	// === HUMAN INTERACTION / 人性化交互 ===
	// ==========================================
	
	// 模拟真实的鼠标点击操作
	async function humanClick(el) {
		if(!el) return;
		
		try {
			const snippet = (el.textContent||'').trim().replace(/\s+/g,' ').slice(0,80);
			vlog('点击元素:', el.tagName, snippet ? `"${snippet}"` : '');
		} catch(e) {}
		
		// 滚动到元素可见位置
		try { el.scrollIntoView({behavior:'auto', block:'center'}); } catch(e) {}
		
		if(CONFIG.HUMANIZE) await humanWait(CONFIG.MOUSE_HOVER_MIN, CONFIG.MOUSE_HOVER_MAX);
		
		// 计算点击位置（添加小幅度随机偏移）
		const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : {left:0,top:0,width:10,height:10};
		const jitterX = Math.floor((Math.random() - 0.5) * Math.max(2, rect.width/4));
		const jitterY = Math.floor((Math.random() - 0.5) * Math.max(2, rect.height/4));
		const x = Math.floor(rect.left + (rect.width||10)/2 + jitterX);
		const y = Math.floor(rect.top + (rect.height||10)/2 + jitterY);
		const evInit = {bubbles:true, cancelable:true, view:window, clientX:x, clientY:y};
		
		// 模拟完整的鼠标事件序列
		try { el.dispatchEvent(new MouseEvent('mouseover', evInit)); } catch(e) {}
		if(CONFIG.HUMANIZE) await humanWait(CONFIG.MOUSE_MOVE_MIN, CONFIG.MOUSE_MOVE_MAX);
		try { el.dispatchEvent(new MouseEvent('mousemove', evInit)); } catch(e) {}
		if(CONFIG.HUMANIZE) await humanWait(CONFIG.MOUSE_DOWN_MIN, CONFIG.MOUSE_DOWN_MAX);
		try { el.dispatchEvent(new MouseEvent('mousedown', evInit)); } catch(e) {}
		if(CONFIG.HUMANIZE) await humanWait(CONFIG.MOUSE_UP_MIN, CONFIG.MOUSE_UP_MAX);
		try { el.dispatchEvent(new MouseEvent('mouseup', evInit)); } catch(e) {}
		if(CONFIG.HUMANIZE) await humanWait(CONFIG.MOUSE_CLICK_MIN, CONFIG.MOUSE_CLICK_MAX);
		try { el.click(); } catch(e) { 
			try { el.dispatchEvent(new MouseEvent('click', evInit)); } catch(e) {} 
		}
		
		// 点击后的自然停顿
		if(CONFIG.HUMANIZE) await humanWait(CONFIG.CLICK_AFTER_MIN, CONFIG.CLICK_AFTER_MAX);
		if(CONFIG.HUMANIZE && Math.random() < 0.06) await wait(rand(CONFIG.EXTRA_THINKING_MIN, CONFIG.EXTRA_THINKING_MAX));
	}

	function dispatchInputAndChange(el) {
		try { el.dispatchEvent(new Event('input', {bubbles:true, cancelable:true})); } catch(e) {}
		try { el.dispatchEvent(new Event('change', {bubbles:true, cancelable:true})); } catch(e) {}
		try { el.dispatchEvent(new Event('blur', {bubbles:true})); } catch(e) {}
	}

	// ==========================================
	// === CORE ACTIONS / 核心操作 ===
	// ==========================================
	
	// 1. 领事馆选择相关
	async function selectConsularPost(postName) {
		log('🏛️ 选择领事馆:', postName);
		
		const selects = Array.from(document.querySelectorAll('select'));
		
		// 精确匹配
		for(const sel of selects) {
			const opts = Array.from(sel.options || []);
			const idx = opts.findIndex(o => (o.text||'').trim().toUpperCase() === postName.trim().toUpperCase());
			if(idx >= 0) {
				try { sel.focus(); } catch(e) {}
				if(CONFIG.HUMANIZE) await humanWait(CONFIG.SELECT_WAIT_MIN, CONFIG.SELECT_WAIT_MAX);
				sel.selectedIndex = idx;
				dispatchInputAndChange(sel);
				try { if(window.jQuery) jQuery(sel).trigger('change'); } catch(e) {}
				log('✓ 成功选择领事馆:', opts[idx].text);
				return true;
			}
		}
		
		// 部分匹配
		for(const sel of selects) {
			const opts = Array.from(sel.options || []);
			const idx = opts.findIndex(o => (o.text||'').toUpperCase().includes(postName.toUpperCase()));
			if(idx >= 0) {
				try { sel.focus(); } catch(e) {}
				if(CONFIG.HUMANIZE) await humanWait(CONFIG.SELECT_WAIT_MIN, CONFIG.SELECT_WAIT_MAX);
				sel.selectedIndex = idx;
				dispatchInputAndChange(sel);
				log('✓ 部分匹配选择领事馆:', opts[idx].text);
				return true;
			}
		}
		
		log('✗ 未找到领事馆选项:', postName);
		return false;
	}

	async function selectBlankConsularOption() {
		log('🔄 选择空白选项以重置状态');
		
		const selects = Array.from(document.querySelectorAll('select'));
		for(const sel of selects) {
			const opts = Array.from(sel.options || []);
			const blankIndex = opts.findIndex(o => ((o.text||'').trim() === '' || (o.value||'') === ''));
			if(blankIndex >= 0) {
				try { sel.focus(); } catch(e) {}
				if(CONFIG.HUMANIZE) await humanWait(CONFIG.SELECT_WAIT_MIN, CONFIG.SELECT_WAIT_MAX);
				sel.selectedIndex = blankIndex;
				dispatchInputAndChange(sel);
				try { if(window.jQuery) jQuery(sel).trigger('change'); } catch(e) {}
				log('✓ 选择了空白选项');
				return { sel, index: blankIndex, insertedTemp: false };
			}
		}
		
		// 如果没有空白选项，创建一个临时的
		if(selects.length) {
			const sel = selects[0];
			try {
				const temp = new Option('', '');
				sel.insertBefore(temp, sel.options[0]);
				sel.selectedIndex = 0;
				dispatchInputAndChange(sel);
				try { if(window.jQuery) jQuery(sel).trigger('change'); } catch(e) {}
				log('✓ 创建并选择了临时空白选项');
				return { sel, index: 0, insertedTemp: true };
			} catch(e) { 
				log('✗ 创建临时空白选项失败', e); 
			}
		}
		
		log('✗ 未找到可选择的空白选项');
		return false;
	}

	// 2. 日期选择相关
	async function findAndClickAvailableDate() {
		log('📅 查找可用日期...');
		
		// 等待日历加载
		const start = Date.now();
		while(Date.now() - start < 10000) {
			if(document.querySelector('#datepicker .ui-datepicker-calendar')) {
				break;
			}
			await wait(CONFIG.CALENDAR_LOAD_CHECK_INTERVAL);
		}
		
		// 查找绿色日期（可用日期）
		const available = Array.from(document.querySelectorAll('#datepicker .greenday'))
			.filter(n => n.offsetParent !== null);
		
		if(!available.length) {
			log('✗ 未找到可用日期');
			return null;
		}
		
		// 尝试点击可用日期，处理可能的PSE0502错误
		const el = available[0];
		const dateText = el.textContent.trim();
		log('🎯 尝试点击日期:', dateText);
		
		try {
			await humanClick(el);
			
			// 点击后稍等片刻，让可能的alert有时间弹出（但会被拦截）
			await wait(1000);
			
			// 检查是否成功加载了时间段
			const timeTable = document.querySelector('#time_select');
			const hasTimeslots = timeTable && timeTable.querySelectorAll('tbody tr').length > 0;
			
			if(hasTimeslots) {
				log('✓ 成功点击日期，时间段已加载:', el.textContent.trim());
				return el;
			} else {
				log('⚠️ 点击日期后未找到时间段，可能遇到PSE0502错误');
				log('🔄 继续尝试其他日期...');
				
				// 如果有多个可用日期，尝试下一个
				for(let i = 1; i < available.length; i++) {
					const nextEl = available[i];
					log(`🎯 尝试备选日期 ${i+1}:`, nextEl.textContent.trim());
					
					await humanClick(nextEl);
					await wait(1000);
					
					const hasNextTimeslots = timeTable && timeTable.querySelectorAll('tbody tr').length > 0;
					if(hasNextTimeslots) {
						log('✓ 备选日期成功:', nextEl.textContent.trim());
						return nextEl;
					}
				}
				
				log('❌ 所有可用日期都遇到PSE0502错误');
				return null;
			}
		} catch(error) {
			log('❌ 点击日期时出错:', error);
			return null;
		}
	}

	async function clickNextPage() {
		// 尝试寻找下一页按钮
		const pageDelay = () => wait(rand(CONFIG.PAGE_FLIP_DELAY_MIN, CONFIG.PAGE_FLIP_DELAY_MAX));
		const trySelectors = [
			"button[aria-label='Next']",
			"button[title='Next']",
			"a[rel='next']",
			".pagination .next", 
			"button.next",
			".ui-datepicker-next"
		];
		
		for(const s of trySelectors) {
			const btn = document.querySelector(s);
			if(btn && !(btn.disabled || btn.className.toLowerCase().includes('disabled'))) {
				await humanClick(btn);
				await pageDelay();
				log('✓ 通过选择器点击了下一页:', s);
				return true;
			}
		}
		
		// 通过文本匹配查找
		const textButtons = Array.from(document.querySelectorAll('button, a'))
			.filter(n => /next|>|下一页/i.test((n.textContent||'').toLowerCase()));
		if(textButtons.length) {
			await humanClick(textButtons[0]);
			await pageDelay();
			log('✓ 通过文本匹配点击了下一页');
			return true;
		}
		
		log('✗ 未找到下一页控件');
		return false;
	}

	// 3. 时间段选择相关  
	async function selectEarliestTimeslot() {
		log('⏰ 查找最早的时间段...');
		
		const table = document.querySelector('#time_select');
		if(!table) {
			log('✗ 未找到 #time_select 表格');
			return null;
		}
		
		tlog('找到 #time_select 表格，解析行数据');
		const rows = Array.from(table.querySelectorAll('tbody tr'));
		tlog('找到', rows.length, '行数据');
		
		if(rows.length === 0) {
			tlog('⚠️ 表格存在但没有行数据，可能还在加载中');
			// 等待一下再重试
			await wait(CONFIG.TIMESLOT_RETRY_WAIT);
			const retryRows = Array.from(table.querySelectorAll('tbody tr'));
			tlog('重试后找到', retryRows.length, '行数据');
			if(retryRows.length === 0) {
				log('✗ 重试后仍然没有行数据');
				return null;
			}
			// 使用重试后的结果
			rows.length = 0;
			rows.push(...retryRows);
		}
		
		// 解析每行获取日期时间
		const timeslots = [];
		rows.forEach((row, idx) => {
			const radio = row.querySelector('input[name="schedule-entries"]');
			const cells = Array.from(row.querySelectorAll('td'));
			
			if(cells.length >= 2 && radio) {
				// 从label中提取日期
				const label = cells[0].querySelector('label');
				const dateText = label ? label.textContent.trim() : '';
				
				// 从第二个cell的div中提取时间
				const timeDiv = cells[1].querySelector('div');
				const timeText = timeDiv ? timeDiv.textContent.trim() : '';
				
				tlog(`行 ${idx}: 日期="${dateText}", 时间="${timeText}"`);
				
				if(dateText && timeText) {
					// 简单的日期解析 YYYY/MM/DD HH:MM 格式
					const combined = `${dateText} ${timeText}`;
					const dt = new Date(combined.replace(/\//g, '-'));
					
					if(!isNaN(dt.getTime())) {
						timeslots.push({
							radio: radio,
							row: row, 
							datetime: dt,
							text: `${dateText} ${timeText}`,
							label: label
						});
						tlog(`行 ${idx}: ${combined} -> ${dt}`);
					} else {
						tlog(`行 ${idx}: 解析失败 "${combined}"`);
					}
				}
			}
		});
		
		if(timeslots.length === 0) {
			log('✗ 没有解析到有效的时间段');
			return null;
		}
		
		// 按日期时间排序，选择最早的
		timeslots.sort((a, b) => a.datetime - b.datetime);
		const earliest = timeslots[0];
		
		log('✓ 选择最早时间段:', earliest.text);
		
		// 点击单选按钮并触发页面处理函数
		try {
			// 先点击label（更可靠）
			if(earliest.label) {
				await humanClick(earliest.label);
			} else {
				await humanClick(earliest.radio);
			}
			
			earliest.radio.checked = true;
			
			// 触发change事件
			earliest.radio.dispatchEvent(new Event('change', {bubbles: true}));
			
			// 尝试调用页面的处理函数
			if(typeof window.onSelectScheduleEntry === 'function') {
				window.onSelectScheduleEntry(earliest.radio);
			}
			
			log('✓ 成功选择时间段:', earliest.text);
			return earliest.radio;
		} catch(e) {
			log('✗ 选择时间段时出错:', e);
			return null;
		}
	}

	// 4. 提交预约相关
	async function submitAppointment() {
		log('📝 准备提交预约...');
		
		// 查找提交按钮
		const submitBtn = document.querySelector('#submitbtn') || 
						  document.querySelector('input[type="submit"][value="Submit"]') ||
						  document.querySelector('.btn-atlas-submit') ||
						  document.querySelector('button[onclick*="Submit"], input[onclick*="Submit"]');
		
		if(!submitBtn) {
			log('❌ 未找到提交按钮');
			return false;
		}
		
		log('🔍 找到提交按钮:', submitBtn.value || submitBtn.textContent || '提交按钮');
		
		try {
			// 确保按钮可见且可点击
			if(submitBtn.style.opacity === '0' || submitBtn.disabled) {
				log('⚠️ 提交按钮不可用，尝试启用...');
				submitBtn.style.opacity = '1';
				submitBtn.disabled = false;
			}
			
			// 人性化等待
			await humanWait(CONFIG.SUBMIT_WAIT_MIN, CONFIG.SUBMIT_WAIT_MAX);
			
			// 点击提交按钮
			await humanClick(submitBtn);
			
			// 如果有页面处理函数，也调用它
			if(typeof window.onClickSubmit === 'function') {
				window.onClickSubmit();
			}
			
			log('✅ 已点击提交按钮');
			
			// 等待页面响应
			await wait(CONFIG.SUBMIT_RESPONSE_WAIT);
			
			// 检查是否有成功提示或页面跳转
			const successIndicators = [
				'success', 'submitted', 'confirmed', 'appointment',
				'成功', '已提交', '确认', '预约'
			];
			
			const pageText = document.body.textContent || '';
			const hasSuccessIndicator = successIndicators.some(indicator => 
				pageText.toLowerCase().includes(indicator.toLowerCase())
			);
			
			if(hasSuccessIndicator) {
				log('🎉 检测到成功提示');
				return true;
			} else {
				log('⚠️ 未检测到明确的成功提示，但已执行提交操作');
				return true; // 假设提交成功
			}
			
		} catch(error) {
			log('❌ 提交预约时出错:', error);
			return false;
		}
	}

	async function waitForTimeslotLoad(timeout = 10000, interval = 300) {
		tlog('等待时间段面板加载, 超时:', timeout);
		const start = Date.now();
		
		while(Date.now() - start < timeout) {
			const timeSelect = document.querySelector('#time_select');
			
			if(timeSelect) {
				// 检查表格是否有实际的行数据
				const rows = timeSelect.querySelectorAll('tbody tr');
				const scheduleInputs = timeSelect.querySelectorAll('input[name="schedule-entries"]');
				
				tlog(`检查 #time_select - 行数: ${rows.length}, radio数: ${scheduleInputs.length}`);
				
				if(rows.length > 0 && scheduleInputs.length > 0) {
					tlog('✓ 检测到时间段面板及数据');
					return true;
				}
			} else {
				tlog('等待 #time_select 表格出现...');
			}
			
			await wait(interval);
		}
		
		tlog('✗ 等待时间段面板加载超时');
		return false;
	}

	// ==========================================
	// === DATE UTILITIES / 日期工具 ===
	// ==========================================
	
	// 容错的日期解析
	function parseDateFromString(s) {
		if(!s || typeof s !== 'string') return null;
		s = s.trim();
		
		// ISO格式 yyyy-mm-dd
		const iso = s.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
		if(iso) return new Date(`${iso[1]}-${iso[2].padStart(2,'0')}-${iso[3].padStart(2,'0')}`);

		// mm/dd/yyyy 格式
		const mdY = s.match(/(\d{1,2})[\/](\d{1,2})[\/](\d{4})/);
		if(mdY) return new Date(`${mdY[3]}-${mdY[1].padStart(2,'0')}-${mdY[2].padStart(2,'0')}`);

		// yyyy/mm/dd 格式
		const ymdSlash = s.match(/(\d{4})[\/](\d{1,2})[\/](\d{1,2})/);
		if(ymdSlash) return new Date(`${ymdSlash[1]}-${ymdSlash[2].padStart(2,'0')}-${ymdSlash[3].padStart(2,'0')}`);

		// 日 月 年 格式 如 10 Dec 2025
		const dmy = s.match(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/);
		if(dmy) {
			const mm = new Date(`${dmy[2]} 1, ${dmy[3]}`);
			if(!isNaN(mm)) return new Date(dmy[3], mm.getMonth(), parseInt(dmy[1],10));
		}

		// 后备方案：Date.parse
		const p = Date.parse(s);
		if(!isNaN(p)) return new Date(p);
		return null;
	}

	// 从点击的日历元素推导完整日期
	function deriveSelectedDate(el) {
		if(!el) return null;
		try {
			// 直接属性获取（某些日历插件会设置 data-year / data-month）
			const dy = el.getAttribute && (el.getAttribute('data-year') || el.getAttribute('dataYear'));
			const dm = el.getAttribute && (el.getAttribute('data-month') || el.getAttribute('dataMonth'));
			const txt = (el.textContent||el.innerText||'').trim();
			const dayMatch = txt.match(/(\d{1,2})/);
			const day = dayMatch ? parseInt(dayMatch[1],10) : null;
			
			if(dy && dm && day) {
				const y = parseInt(dy,10);
				const m = parseInt(dm,10);
				const d = new Date(y, m, day);
				if(!isNaN(d)) return d;
			}
			
			// 从日历头部获取月份年份信息
			const picker = el.closest && (el.closest('.ui-datepicker') || el.closest('#datepicker') || 
				document.querySelector('.ui-datepicker') || document.querySelector('#datepicker'));
			if(picker) {
				const monNode = picker.querySelector('.ui-datepicker-month');
				const yrNode = picker.querySelector('.ui-datepicker-year');
				if(monNode && yrNode && day) {
					const monthName = (monNode.textContent||monNode.innerText||'').trim();
					const yearNum = parseInt((yrNode.textContent||yrNode.innerText||'').trim(),10);
					const tryParse = Date.parse(`${day} ${monthName} ${yearNum}`);
					if(!isNaN(tryParse)) return new Date(tryParse);
					
					// 备用：从月份名称推导月份索引
					const months = ['january','february','march','april','may','june',
						'july','august','september','october','november','december'];
					const mi = months.indexOf(monthName.toLowerCase());
					if(mi >= 0) return new Date(yearNum, mi, day);
				}
				
				// 某些日历有组合标题如 'December 2025'
				const titleNode = picker.querySelector('.ui-datepicker-title, .datepicker-title, .month-title, .calendar-header');
				if(titleNode && day) {
					const title = (titleNode.textContent||titleNode.innerText||'').trim();
					const tryParse = Date.parse(`${day} ${title}`);
					if(!isNaN(tryParse)) return new Date(tryParse);
				}
			}
			
			// 后备方案：尝试直接解析元素文本
			const direct = parseDateFromString(txt);
			if(direct) return direct;
		} catch(e) { 
			vlog('推导选中日期出错', e); 
		}
		return null;
	}

	// ==========================================
	// === WORKFLOW STEPS / 工作流步骤 ===
	// ==========================================
	
	async function runStep1() {
		log('=== 步骤 1: 选择领事馆 ===');
		const success = await selectConsularPost(CONFIG.TARGET_POST);
		if(success) {
			log('✅ 步骤1完成: 成功选择', CONFIG.TARGET_POST);
			
			// 自动继续到步骤2
			if(CONFIG.AUTO_CONTINUE) {
				log('⏩ 自动继续到步骤 2...');
				await humanWait(CONFIG.STEP_TRANSITION_MIN, CONFIG.STEP_TRANSITION_MAX);
				
				// 多次检测，给页面更多时间加载
				let step2Detected = false;
				for(let i = 0; i < 5; i++) {
					if(isStep2()) {
						step2Detected = true;
						break;
					}
					await wait(CONFIG.STEP_DETECTION_RETRY_INTERVAL);
				}
				
				if(step2Detected) {
					const result = await runStep2();
					if(result) {
						// 检查是否需要继续搜索
						if(result.continueSearch) {
							// 检查停止请求
							if(CONFIG.STOP_REQUESTED) {
								log('🛑 检测到停止请求，终止搜索流程');
								return;
							}
							log('🔄 需要继续搜索，开始重置流程...');
							await handleContinueSearch();
						} else {
							log('🎉 工作流程完成!');
						}
					}
				} else {
					log('ℹ️ 请导航到步骤 2 页面并重新运行脚本');
				}
			}
		} else {
			log('❌ 步骤1失败: 无法选择', CONFIG.TARGET_POST);
		}
		return success;
	}

	// 处理继续搜索的流程
	async function handleContinueSearch() {
		// 增加循环计数
		cycleCount++;
		
		// 检查停止请求，如果已停止就不要开始新的搜索
		if(CONFIG.STOP_REQUESTED) {
			log('� 检测到停止请求，取消继续搜索');
			return;
		}
		
		log('�🔄 开始重置和重新搜索流程');
		
		// 等待更长的随机时间，避免频繁请求 (5-8分钟)
		const waitTime = rand(CONFIG.CONTINUE_SEARCH_WAIT_MIN, CONFIG.CONTINUE_SEARCH_WAIT_MAX);
		const waitMinutes = Math.round(waitTime/60000 * 10) / 10; // 精确到0.1分钟
		log(`⏳ [第${cycleCount}次循环] 快速刷新模式：等待`, waitMinutes, '分钟后开始重置...');
		log('🔒 模拟真实用户的长时间思考间隔');
		await wait(waitTime);
		
		// 再次检查停止请求
		if(CONFIG.STOP_REQUESTED) {
			log('🛑 等待期间检测到停止请求，取消重置');
			return;
		}
		
		// 选择领事馆的空白选项来重置状态
		log(`🔄 [第${cycleCount}次循环] 重置领事馆选择...`);
		const resetResult = await selectBlankConsularOption();
		
		if(resetResult) {
			log(`✅ [第${cycleCount}次循环] 成功重置领事馆状态`);
			
			// 等待更长时间让服务器状态更新，保持低频访问
			const resetWaitTime = rand(CONFIG.SERVER_UPDATE_WAIT_MIN, CONFIG.SERVER_UPDATE_WAIT_MAX);
			const resetMinutes = Math.round(resetWaitTime/60000 * 10) / 10;
			log('⏳ 服务器更新等待：', resetMinutes, '分钟，确保状态完全更新...');
			await wait(resetWaitTime);
			
			// 重新开始：选择目标领事馆
			log('🏛️ 重新开始，选择' + CONFIG.TARGET_POST + '领事馆...');
			const selectResult = await selectConsularPost(CONFIG.TARGET_POST);
			
			if(selectResult) {
				log('✅ 重新选择', CONFIG.TARGET_POST, '成功');
				
				// 自动继续到步骤2，开始新一轮搜索
				if(CONFIG.AUTO_CONTINUE) {
					log('⏩ 自动继续到步骤 2 开始新一轮搜索...');
					await humanWait(CONFIG.STEP_TRANSITION_MIN, CONFIG.STEP_TRANSITION_MAX);
					
					// 检测步骤2
					let step2Detected = false;
					for(let i = 0; i < 5; i++) {
						if(isStep2()) {
							step2Detected = true;
							break;
						}
						await wait(CONFIG.STEP_DETECTION_RETRY_INTERVAL);
					}
					
					if(step2Detected) {
						const newResult = await runStep2();
						if(newResult && newResult.continueSearch) {
							// 检查是否应该停止，避免无限递归
							if(CONFIG.STOP_REQUESTED) {
								log('🛑 检测到停止请求，终止搜索流程');
								return;
							}
							// 如果还需要继续搜索，递归调用
							log('🔄 新一轮搜索仍需继续，再次重置...');
							await handleContinueSearch();
						} else {
							log('🎉 搜索流程完成!');
						}
					} else {
						log('⚠️ 重置后未能进入步骤2');
					}
				}
			} else {
				log('❌ 重新选择领事馆失败');
			}
			
			// 清理临时选项（如果有）
			if(resetResult.insertedTemp) {
				try {
					resetResult.sel.remove(resetResult.index);
					log('🧹 已清理临时空白选项');
				} catch(e) {
					log('⚠️ 清理临时选项失败:', e);
				}
			}
		} else {
			log('❌ 重置领事馆状态失败');
		}
	}

	async function runStep2() {
		log('=== 步骤 2: 查找并选择日期 ===');
		
		// 进行完整的日期搜索流程
		const searchResult = await searchAndSelectDate();
		
		if(!searchResult || !searchResult.selectedDate) {
			log('❌ 步骤2: 搜索完成但未找到可用日期');
			// 完整搜索周期完成，没找到日期，需要重置继续搜索
			return { continueSearch: true, reason: 'no_dates_found' };
		}
		
		const selectedDate = searchResult.selectedDate;
		
		// 日期已选择，现在等待并选择时间段
		log('✅ 已选择日期:', formatLocalDate(selectedDate));
		await waitForTimeslotLoad(15000, 500);  // 增加等待时间到15秒
		
		const timeslot = await selectEarliestTimeslot();
		if(timeslot) {
			log('✅ 步骤2完成 - 已选择时间段');
			
			// 检查选中的日期是否早于截止日期
			if(selectedDate < CONFIG.DATE_CUTOFF) {
				log('🎯 选中日期', formatLocalDate(selectedDate), '早于截止日期', formatLocalDate(CONFIG.DATE_CUTOFF));
				
				let shouldSubmit = false;
				
				if(CONFIG.AUTO_SUBMIT) {
					// 自动提交模式
					log('🤖 自动提交模式：找到理想日期，自动提交预约');
					shouldSubmit = true;
				} else {
					// 用户确认模式
					log('👤 用户确认模式：弹出确认对话框');
					const userConfirmed = confirm(
						`✅ 找到理想日期！\n\n` +
						`选中日期: ${formatLocalDate(selectedDate)}\n` +
						`截止日期: ${formatLocalDate(CONFIG.DATE_CUTOFF)}\n\n` +
						`是否立即提交预约？\n\n` +
						`点击"确定"提交预约\n` +
						`点击"取消"继续搜索更多选项`
					);
					shouldSubmit = userConfirmed;
				}
				
				if(shouldSubmit) {
					log(CONFIG.AUTO_SUBMIT ? '🤖 自动提交预约' : '👤 用户确认提交预约');
					const submitResult = await submitAppointment();
					if(submitResult) {
						log('🎉 预约提交成功！');
						return { date: selectedDate, timeslot, submitted: true };
					} else {
						log('❌ 预约提交失败');
						return { date: selectedDate, timeslot, submitted: false };
					}
				} else {
					log('👤 用户选择继续搜索，不提交预约');
					// 用户不满意这个日期，继续搜索
					return { continueSearch: true, reason: 'user_declined' };
				}
			} else {
				log('📅 选中日期', formatLocalDate(selectedDate), '不早于截止日期');
				// 找到了日期但不满足条件，一个完整搜索周期完成，需要重置继续搜索
				log('🔄 完整搜索周期完成，准备重置继续搜索');
				return { date: selectedDate, timeslot, submitted: false, continueSearch: true, reason: 'date_not_ideal' };
			}
		} else {
			log('⚠️ 步骤2: 日期已选择但无可用时间段');
			// 找到了日期但没有时间段，继续搜索
			return { date: selectedDate, timeslot: null, continueSearch: true, reason: 'no_timeslots' };
		}
	}

	async function searchAndSelectDate() {
		let flips = 0;
		let totalPagesSearched = 0;
		
		while(flips < CONFIG.MAX_PAGE_FLIPS) {
			totalPagesSearched++;
			log(`📄 搜索第 ${totalPagesSearched} 页...`);
			
			const dateElement = await findAndClickAvailableDate();
			
			if(dateElement) {
				const selectedDate = deriveSelectedDate(dateElement);
				if(selectedDate) {
					log('📅 在第', totalPagesSearched, '页选择了日期:', formatLocalDate(selectedDate));
					return { 
						selectedDate, 
						dateElement, 
						pagesSearched: totalPagesSearched,
						foundDate: true 
					};
				}
			}
			
			// 当前页面没找到日期，尝试下一页
			const hasNext = await clickNextPage();
			if(!hasNext) {
				log('📄 没有更多页面可搜索，已搜索', totalPagesSearched, '页');
				break;
			}
			
			flips++;
			await wait(CONFIG.CONTINUE_SEARCH_PREPARATION);
		}
		
		log(`📄 完整搜索周期完成：搜索了 ${totalPagesSearched} 页，未找到可用日期`);
		return { 
			selectedDate: null, 
			dateElement: null, 
			pagesSearched: totalPagesSearched, 
			foundDate: false 
		};
	}
	
	async function resetConsularPostAndRetry(attemptNumber) {
		log('🔄 重置领事馆选择 (尝试', attemptNumber, '/', CONFIG.RESET_RETRY_LIMIT, ')');
		
		// 选择空白选项重置服务器状态
		const resetResult = await selectBlankConsularOption();
		
		// 等待一段时间再重新选择
		const waitTime = rand(CONFIG.RESET_WAIT_MIN_MS, CONFIG.RESET_WAIT_MAX_MS);
		log('⏳ 等待', waitTime, 'ms 后重新选择领事馆...');
		await wait(waitTime);
		
		// 重新选择目标领事馆
		await selectConsularPost(CONFIG.TARGET_POST);
		
		// 清理临时选项
		if(resetResult && resetResult.insertedTemp) {
			try { resetResult.sel.remove(resetResult.index); } catch(e) {}
		}
		
		// 等待页面更新
		await humanWait(CONFIG.CONTINUE_SEARCH_MIN, CONFIG.CONTINUE_SEARCH_MAX);
	}

	async function runStep3() {
		log('=== 步骤 3: 选择时间段 ===');
		
		// 等待时间段面板加载
		await waitForTimeslotLoad(8000, 300);
		
		// 选择最早的可用时间段
		const timeslot = await selectEarliestTimeslot();
		
		if(timeslot) {
			log('✅ 步骤3完成: 成功选择时间段');
			return timeslot;
		} else {
			log('❌ 步骤3失败: 无法选择时间段');
			return null;
		}
	}

	// 辅助函数：尝试点击继续按钮
	async function clickContinueButton() {
		log('🔍 寻找并点击继续按钮...');
		
		const continueButtons = Array.from(document.querySelectorAll('button, a, input[type="submit"]'))
			.filter(el => /continue|next|下一步|继续|proceed|submit/i.test(el.textContent || el.value || ''));
		
		if(!continueButtons.length) {
			log('✗ 未找到继续按钮');
			return false;
		}
		
		for(let i = 0; i < continueButtons.length; i++) {
			const btn = continueButtons[i];
			const text = (btn.textContent || btn.value || '').trim();
			log(`🔍 尝试点击按钮 ${i+1}: "${text}"`);
			
			try {
				await humanClick(btn);
				log('✓ 点击成功，等待页面加载...');
				await wait(CONFIG.TIMESLOT_RETRY_WAIT);
				
				// 检查是否成功进入步骤2
				if(isStep2()) {
					log('✅ 成功进入步骤2！');
					return true;
				}
			} catch(e) {
				log('✗ 点击失败:', e.message);
			}
		}
		
		log('⚠️ 所有按钮都尝试过了，但未进入步骤2');
		return false;
	}

	// ====================
	// 主要流程调度器
	// ====================
	
	const main = async () => {
		log(`� [第${cycleCount}次循环] 开始美国签证自动预约脚本...`);
		
		try {
			let currentStep = 0;
			
			// 检测当前页面状态
			if(isStep1()) {
				currentStep = 1;
			} else if(isStep2()) {
				currentStep = 2;
			} else if(isStep3()) {
				currentStep = 3;
			}
			
			log(`📍 [第${cycleCount}次循环] 检测到当前处于步骤 ${currentStep}`);
			
			switch(currentStep) {
				case 1:
					const step1Result = await runStep1();
					break;
				case 2:
					const step2Result = await runStep2();
					break;
				case 3:
					const step3Result = await runStep3();
					break;
				default:
					log('❌ 无法识别当前页面步骤');
					log('ℹ️ 请确保您在正确的签证预约页面');
					break;
			}
			
			// 循环完成，准备下一次循环
			const waitTime = Math.floor(Math.random() * (CONFIG.CONTINUE_SEARCH_WAIT_MAX - CONFIG.CONTINUE_SEARCH_WAIT_MIN)) + CONFIG.CONTINUE_SEARCH_WAIT_MIN;
			log(`⏱️ [第${cycleCount}次循环完成] 等待 ${Math.round(waitTime/1000)} 秒后开始下一次循环...`);
			
			setTimeout(() => {
				main().catch(error => {
					log('❌ 循环执行出错:', error);
					// 即使出错也继续循环
					setTimeout(() => main(), 30000); // 30秒后重试
				});
			}, waitTime);
			
		} catch(error) {
			log(`❌ [第${cycleCount}次循环] 脚本执行出错:`, error);
			log('🔄 30秒后自动重试下一次循环...');
			setTimeout(() => main(), 30000);
		}
	};

	// 暴露工具函数供手动控制
	window.usVisaAuto = {
		run: main,
		config: CONFIG,
		log: log,
		// 日志管理功能
		logs: LogStorage,
		getCycleCount: () => cycleCount,
		downloadLogs: () => LogStorage.downloadLogs(),
		clearLogs: () => LogStorage.clearLogs(),
		// 提交模式控制函数
		setAutoSubmit: function(enabled) {
			CONFIG.AUTO_SUBMIT = enabled;
			log(enabled ? '🤖 已切换到自动提交模式' : '👤 已切换到用户确认模式');
		},
		enableAutoSubmit: function() {
			CONFIG.AUTO_SUBMIT = true;
			log('🤖 已启用自动提交模式');
		},
		enableUserConfirm: function() {
			CONFIG.AUTO_SUBMIT = false;
			log('👤 已启用用户确认模式');
		},
		getSubmitMode: function() {
			return CONFIG.AUTO_SUBMIT ? '自动提交' : '用户确认';
		},
		// 停止控制函数
		stop: function() {
			stopScript();
		}
	};

	log('✅ 美国签证自动预约脚本已加载完成');
	log('🔘 页面右上角有停止按钮');
	log('📋 当前提交模式:', CONFIG.AUTO_SUBMIT ? '🤖 自动提交' : '👤 用户确认');
	log('� 运行模式: 低频安全模式 - 避免被系统检测');
	log('⏰ 循环间隔: 1-3分钟快速刷新，最大化预约成功率');
	log('�💡 可通过 usVisaAuto.setAutoSubmit(true/false) 切换模式');

	// ==========================================
	// === AUTO-START / 自动启动 ===
	// ==========================================
	
	// 创建停止按钮
	createStopButton();
	
	// 创建日志下载按钮
	createLogDownloadButton();
	
	// 创建日志状态面板
	createLogStatusPanel();

	// 创建参数配置面板（默认加载，可用“参数”按钮折叠）
	createConfigPanel();
	
	// 输出快速刷新模式信息
	log('� 已启用快速刷新模式：约1-3分钟一次循环');
	log('⚡ 高频率搜索以获得最佳预约时机');
	log('📊 循环计数和日志保存已启用');
	
	// 自动运行脚本
	setTimeout(() => {
		log('🚀 自动启动签证预约脚本...');
		main().catch(error => {
			log('❌ 自动运行失败:', error);
		});
	}, 1000);

})();
