// const DISABLE_XDEBUG_PROFILER_RULE_TEMPLATE = {
// 	condition: {
// 		resourceTypes: ["main_frame"]
// 	},
// 	action: {
// 		type: "redirect",
// 		redirect: {
// 			transform: {
// 				queryTransform: {
// 					removeParams: [
// 						"XDEBUG_PROFILE"
// 					]
// 				}
// 			}
// 		}
// 	}
// };

// const ENABLE_XDEBUG_PROFILER_RULE_TEMPLATE = {
// 	condition: {
// 		resourceTypes: ["main_frame"]
// 	},
// 	action: {
// 		type: "redirect",
// 		redirect: {
// 			transform: {
// 				queryTransform: {
// 					addOrReplaceParams: [
// 						{key: "XDEBUG_PROFILE"}
// 					]
// 				}
// 			}
// 		}
// 	}
// };

// function update_xdebug_profiler_rule(params) {
// 	const enabled = params.enabled;
// 	const flag = params.flag;

// 	let initial_rule;

// 	if(enabled) {
// 		initial_rule = Utils.merge(
// 			ENABLE_XDEBUG_PROFILER_RULE_TEMPLATE,
// 			{
// 				action: {
// 					redirect: {
// 						transform: {
// 							queryTransform: {
// 								addOrReplaceParams: [
// 									{key: "XDEBUG_PROFILE", value: flag}
// 								]
// 							}
// 						}
// 					}
// 				}
// 			}
// 		);
// 	} else {
// 		initial_rule = DISABLE_XDEBUG_PROFILER_RULE_TEMPLATE;
// 	}

// 	initial_rule.id = 1;

// 	chrome.declarativeNetRequest.updateDynamicRules({
// 		addRules: [
// 			initial_rule,
// 		],
// 		removeRuleIds: [1],
// 	});
// }

// // Profiler initial settings
// chrome.storage.sync.get(['XdebugFilter'], op => {
// 	if(!op.XdebugFilter) op.XdebugFilter = XdebugFilter.default_options;

// 	const enabled = op.XdebugFilter.sync.profiler.enabled;
// 	const flag = op.XdebugFilter.sync.profiler.flag;
	
// 	//update_xdebug_profiler_rule({enabled, flag});
// });

// chrome.runtime.onMessage.addListener(message => {
// 	if(message.method === 'UPDATE_XDEBUG_PROFILER_RULE') {
// 		//update_xdebug_profiler_rule(message.args);
// 	}
// });

// TODO: Use some data structure with multiple identifiers
const data = {
	errors: [],
	var_dumps: [],
};

const clients = [];
const content_scripts = [];


// TODO: Optimize this function, send only changes (INSERT, UPDATE, REMOVE)
// Analyze this: Utils.merge({a:[1,{b:3}]},{a:{1:{c:4}}})
function sync_clients() {
	if(clients.length === 0) return;

	clients.forEach(c => c.port.postMessage({
		method: 'SYNC_CLIENT',
		data,
	}));
}

// Content Script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if(message.method === 'SYNC_SERVER') {
		for(let key of ['errors', 'var_dumps']) {
			// Remove elements
			message.data.removed[key].forEach(el_id => {
				data[key] = data[key].filter(el => {
					return !(el.element_id === el_id && el.tab_id === sender.tab.id && el.frame_id === message.data.frame_id);
				});
			});

			// Add elements
			message.data.added[key].forEach(d => {
				data[key].push({...d, tab_id: sender.tab.id, frame_id: message.data.frame_id});
			});
		}
	} else if(message.method === 'REMOVE_TAB') {
		data.errors = data.errors.filter(d => d.tab_id != sender.tab.id || d.frame_id != message.data.frame_id);
		data.var_dumps = data.var_dumps.filter(d => d.tab_id != sender.tab.id || d.frame_id != message.data.frame_id);
	} else if(message.method === 'PING') {
		console.log('PING');
	} else {
		return;
	}

	sync_clients();
});

chrome.tabs.onRemoved.addListener((tab_id, removed) => {
	const popup_tab_ids = clients.filter(c => c.tab_id === tab_id).map(c => c.port.sender.tab.id);
	chrome.tabs.remove(popup_tab_ids);
});

chrome.runtime.onConnect.addListener(port => {
	if (port.name.startsWith('popup_')) {
		const tab_id = parseInt(port.name.split('_')[1]);
		const client = {port, tab_id};

		content_scripts.filter(p => p.sender.tab.id === tab_id).forEach(p => p.postMessage({method: 'HIDE_ELEMENTS'}));
		
		clients.push(client);

		sync_clients();

		port.onDisconnect.addListener(() => {
			clients.splice(clients.indexOf(client), 1);

			content_scripts.filter(p => p.sender.tab.id === tab_id).forEach(p => p.postMessage({method: 'SHOW_ELEMENTS'}));
		});
	} else if(port.name === 'content_script') {
		content_scripts.push(port);

		if(clients.filter(c => c.tab_id === port.sender.tab.id).length > 0) {
			port.postMessage(({method: 'HIDE_ELEMENTS'}));
		}

		port.onDisconnect.addListener(() => {
			content_scripts.splice(content_scripts.indexOf(port), 1);
		});
	}
});

const contextMenuItem = {
	"id": "php_utils_xdebug",
	"title": "PHP Utils - XDebug",
	"contexts": ["page"]
};

chrome.runtime.onInstalled.addListener(() => {
	chrome.contextMenus.create(contextMenuItem);
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
	if(info.menuItemId == "php_utils_xdebug") {
		open_popup(tab);
	}
});

chrome.commands.onCommand.addListener((command, tab) => {
	console.log(command);
	if(command == 'open_popup') open_popup(tab);
});

function open_popup(tab) {
	let url = chrome.runtime.getURL(`xdebug-utils.html`);
	const tab_url = new URL(tab.url);
	tab_url.search = '';

	if(tab_url.toString() === url) return;

	url += '?tab_id=' + tab.id;

	chrome.tabs.query({
		url,
	}, tabs => {
		if(tabs.length == 0) {
			chrome.windows.create({
				url,
				type: 'popup',
				left: 10,
				top: 100,
				width: 400,
				height: 800,
			});
		} else {
			chrome.windows.update(tabs[0].windowId, {
				focused: true,
			});
		}
	});
}