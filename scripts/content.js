/*
 * Copyright (C) 2024 [Ayama].
 * Author: Ayama (https://github.com/1818180)
 * This file is part of [contextsaver].
 *
 * [contextsaver] is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * [contextsaver] is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with [contextsaver]. If not, see <https://www.gnu.org/licenses/>.
 */


const contextsaverElement = document.createElement('div');
contextsaverElement.id = 'context-saver-desktop';
document.documentElement.appendChild(contextsaverElement);
const shadowRoot = contextsaverElement.attachShadow({ mode: 'open' });

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = chrome.runtime.getURL('scripts/styles.css'); 
shadowRoot.appendChild(link);

// 提供外部访问 Shadow DOM 的方法
window.getContextSaverShadowRoot = function () {
  return contextsaverElement.shadowRoot;
};

//网页操作函数
function elementCreator(element, classlist, id) {
  const newelement = document.createElement(element);
  if (classlist) {
    classlist.forEach(className => {
      newelement.classList.add(className);
    });
  }
  if (id) {
    newelement.id = id;
  }
  return newelement;
}

function elementAppender(parentelement, childlist) {
  childlist.forEach(child => {
    parentelement.appendChild(child);
  })
}

function deleteItems(element, classname) {
  const allitems = element.querySelectorAll(classname);
  if (allitems) {
    allitems.forEach(item => {
      item.remove();
    });
  }
}

//数据库函数
//获取所有标注内容(object格式)
function getAllAnnotations () {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {type: "getAnnonamelist",
       aimtype:'annotation'
      }
      , function(response) {
        resolve(response);
      }
    );
  });
}

//稍后读数据处理函数 [save,delete,get]
const objread = 'readlater';
const objweb = 'webinfo';
function contentDBProceer(objname, processtype, processcontent) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {type: "contentDBProceer",
       objName: objname,
       processType: processtype,
       processContent: processcontent,
      }
      , function(response) {
        resolve(response);
      }
    );
  });
}

// 创建全局共享数据
let selectedRange;
let annotation; 
let context;
let annoindex;
const url = window.location.href;
const title = document.title;
let lang = document.documentElement.lang;
if (!lang) {
  lang = '';
}
//封面提取逻辑
let webimage;
let aimimg;
if (document.querySelector('article img[alt]')) {
  aimimg = document.querySelector('article img[alt]');
  if (aimimg) {
    webimage = aimimg.src;
  }
} else if(document.querySelector('article img[src]')) {
  aimimg = document.querySelector('article img[src]');
  if (aimimg) {
    webimage = aimimg.src;
  }
} else if(document.querySelector('main img')) {
  aimimg = document.querySelector('main img');
  if (aimimg) {
    webimage = aimimg.src;
  }
} else {
  webimage = '';
}

let webicon = document.querySelector('link[rel="icon"]');
if (webicon) {
  webicon = webicon.href;
} else {
  webicon = '';
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 月份从0开始
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}.${month}.${day}`;
}

//创建侧边组件
const sideButtonContainer = elementCreator('div',['side_container','flex-column']);
//禁止标注
const annoSwitchBox = elementCreator('div',['side_box','flex-row']);
const annoSwitchIcon = elementCreator('div',['side_icon']);
annoSwitchIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="50" height="50" viewBox="0 0 48 48">
<path d="M 36 5.0097656 C 34.205301 5.0097656 32.410791 5.6901377 31.050781 7.0507812 L 8.9160156 29.183594 C 8.4960384 29.603571 8.1884588 30.12585 8.0253906 30.699219 L 5.0585938 41.087891 A 1.50015 1.50015 0 0 0 6.9121094 42.941406 L 17.302734 39.974609 A 1.50015 1.50015 0 0 0 17.304688 39.972656 C 17.874212 39.808939 18.39521 39.50518 18.816406 39.083984 L 40.949219 16.949219 C 43.670344 14.228094 43.670344 9.7719064 40.949219 7.0507812 C 39.589209 5.6901377 37.794699 5.0097656 36 5.0097656 z M 28.123047 14.220703 L 33.779297 19.876953 L 16.693359 36.962891 C 16.634729 37.021121 16.560472 37.065723 16.476562 37.089844 L 15.488281 37.371094 L 10.626953 32.509766 L 10.910156 31.521484 A 1.50015 1.50015 0 0 0 10.910156 31.519531 C 10.933086 31.438901 10.975086 31.366709 11.037109 31.304688 L 28.123047 14.220703 z"></path>
</svg>`
const annoSwitch = elementCreator('div',['side-btn']);
annoSwitch.innerText = "禁止标注";
//标注提示
const noteSwitchBox = elementCreator('div',['side_box','flex-row']);
const noteSwitchIcon = elementCreator('div',['side_icon']);
noteSwitchIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="50" height="50" viewBox="0 0 48 48">
<path d="M 24 4 C 15.181311 4 8 11.181311 8 20 C 8 24.855113 10.17251 28.191538 12.285156 30.589844 C 14.397802 32.98815 16.237593 34.689476 16.474609 35.808594 C 16.98063 38.196568 17.515625 40.492187 17.515625 40.492188 L 17.513672 40.476562 C 17.96956 42.527106 19.805371 44 21.90625 44 L 26.09375 44 C 28.19401 44 30.029959 42.527432 30.486328 40.478516 C 30.489428 40.464996 31.018914 38.189504 31.523438 35.808594 C 31.760784 34.689262 33.602049 32.988169 35.714844 30.589844 C 37.827639 28.191518 40 24.855113 40 20 C 40 11.181311 32.818689 4 24 4 z M 24 7 C 31.197311 7 37 12.802689 37 20 C 37 23.994887 35.366299 26.448997 33.464844 28.607422 C 31.850623 30.439794 29.901089 31.892098 28.982422 34 L 19.015625 34 C 18.097627 31.892018 16.149292 30.439811 14.535156 28.607422 C 12.633896 26.448953 11 23.994887 11 20 C 11 12.802689 16.802689 7 24 7 z M 19.8125 37 L 28.185547 37 C 27.92023 38.186825 27.560547 39.810547 27.560547 39.810547 L 27.558594 39.818359 L 27.558594 39.826172 C 27.404331 40.520337 26.804871 41 26.09375 41 L 21.90625 41 C 21.195129 41 20.595565 40.519634 20.441406 39.826172 L 20.439453 39.818359 L 20.4375 39.810547 C 20.4375 39.810547 20.077817 38.186825 19.8125 37 z"></path>
</svg>`
const noteSwitch = elementCreator('div',['side-btn']);
noteSwitch.innerText = "开启提示";
//链接点击失效
const linkBox = elementCreator('div',['side_box','flex-row']);
const linkIcon = elementCreator('div',['side_icon']);
linkIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="50" height="50" viewBox="0 0 48 48">
<path d="M 13 13 C 6.9424416 13 2 17.942442 2 24 C 2 30.057558 6.9424416 35 13 35 L 17.5 35 A 1.50015 1.50015 0 1 0 17.5 32 L 13 32 C 8.5635584 32 5 28.436442 5 24 C 5 19.563558 8.5635584 16 13 16 L 17.5 16 A 1.50015 1.50015 0 1 0 17.5 13 L 13 13 z M 30.5 13 A 1.50015 1.50015 0 1 0 30.5 16 L 35 16 C 39.436442 16 43 19.563558 43 24 C 43 28.436442 39.436442 32 35 32 L 30.5 32 A 1.50015 1.50015 0 1 0 30.5 35 L 35 35 C 41.057558 35 46 30.057558 46 24 C 46 17.942442 41.057558 13 35 13 L 30.5 13 z M 11.5 22.5 A 1.50015 1.50015 0 1 0 11.5 25.5 L 36.5 25.5 A 1.50015 1.50015 0 1 0 36.5 22.5 L 11.5 22.5 z"></path>
</svg>`
const linkSwitch = elementCreator('div',['side-btn']);
linkSwitch.innerText = "冻结链接";
//添加到稍后读
const readBox = elementCreator('div',['side_box','flex-row','round-box']);
const readIcon = elementCreator('div',['side_icon']);
readIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="50" height="50" viewBox="0 0 48 48">
<path d="M 23.976562 4.9785156 A 1.50015 1.50015 0 0 0 22.5 6.5 L 22.5 22.5 L 6.5 22.5 A 1.50015 1.50015 0 1 0 6.5 25.5 L 22.5 25.5 L 22.5 41.5 A 1.50015 1.50015 0 1 0 25.5 41.5 L 25.5 25.5 L 41.5 25.5 A 1.50015 1.50015 0 1 0 41.5 22.5 L 25.5 22.5 L 25.5 6.5 A 1.50015 1.50015 0 0 0 23.976562 4.9785156 z"></path>
</svg>`;
const readSwitch = elementCreator('div',['side-btn']);
readSwitch.innerText = "稍后读";
//稍后读列表
const readlistBox = elementCreator('div',['flex-row','readlistBox']);
const readlistIcon = elementCreator('div',['read-box','read-icon', 'flex','center']);
const readlistContainer = elementCreator('div',['readlist-container','flex-column']);

shadowRoot.appendChild(sideButtonContainer);
elementAppender(sideButtonContainer,[annoSwitchBox,linkBox,readBox,readlistBox]);
elementAppender(annoSwitchBox,[annoSwitchIcon,annoSwitch]);
elementAppender(linkBox,[linkIcon,linkSwitch]);
elementAppender(readBox,[readIcon,readSwitch]);
elementAppender(readlistBox,[readlistIcon,readlistContainer]);

let highlightIndex = 0;
let annoIndex = 0;
let linkIndex = 0;
let readIndex = 0;
let listnumber;

function switchCondition(index) {
  if (index === 1) {
    index = 0;
  } else {
    index = 1;
  }
  return index
}

//添加至稍后读
function readlaterComponent(readinfo) {
  const webComponent = elementCreator('div',['flex-row','web-container']);
  const coverImg = elementCreator('div',['read-cover']);
  const coverelement = elementCreator('img',['img-cover']);
  const rightInfo = elementCreator('div',['flex-column','rightinfo']);
  const titleCom = elementCreator('a',['titleCom']);
  const bottomInfo = elementCreator('div',['flex-row','space-between']);
  const dateCom = elementCreator('p',['dateCom']);
  const toolCom = elementCreator('div',['read-btn','side_icon']);
  
  elementAppender(webComponent,[coverImg,rightInfo]);
  elementAppender(coverImg,[coverelement]);
  elementAppender(rightInfo,[titleCom,bottomInfo]);
  elementAppender(bottomInfo,[dateCom,toolCom]);
  //导入信息
  coverelement.src = readinfo.img;
  titleCom.href = readinfo.url;
  titleCom.innerText = readinfo.title;
  dateCom.innerText = formatTimestamp(readinfo.date);
  toolCom.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 48 48">
  <path d="M 39.486328 6.9785156 A 1.50015 1.50015 0 0 0 38.439453 7.4394531 L 24 21.878906 L 9.5605469 7.4394531 A 1.50015 1.50015 0 0 0 8.484375 6.984375 A 1.50015 1.50015 0 0 0 7.4394531 9.5605469 L 21.878906 24 L 7.4394531 38.439453 A 1.50015 1.50015 0 1 0 9.5605469 40.560547 L 24 26.121094 L 38.439453 40.560547 A 1.50015 1.50015 0 1 0 40.560547 38.439453 L 26.121094 24 L 40.560547 9.5605469 A 1.50015 1.50015 0 0 0 39.486328 6.9785156 z"></path>
  </svg>`
  toolCom.addEventListener('click', () => {
    webComponent.style.display = 'none';
    deleteReadItem(readinfo.url);
  })
  return webComponent
}
//创建稍后读信息列表
const websiteInfo = {
  'url': url,
  'title': title,
  'img': webimage,
  'icon': webicon,
  'date': Date.now(),
  'lan': lang,
}

let readListInfo;
async function readLaterFetch() {
  readListInfo = await contentDBProceer(objread,'get','');
  if (readListInfo.length > 0) {
    readlistBox.style.visibility = 'visible';
    deleteItems(readlistBox,'.web-container');
    listnumber = readListInfo.length;
    readlistIcon.innerHTML = `<p class="side-icon">${listnumber}</p>`;
    const urllist = [];
    readListInfo.forEach(readinfo => {
      urllist.push(readinfo.url);
      if (url == readinfo.url) {
        readIndex = 1;
        addReadIcon();
      }
      if (url == readinfo.url && readListInfo.length == 1) {
        readlistBox.style.visibility = 'hidden';
      } 
      if (url !== readinfo.url) {
        const readComponent = readlaterComponent(readinfo);
        elementAppender(readlistContainer,[readComponent]);
      }
    })
    if (urllist.includes(url) && urllist.length == 1) {
      readlistBox.style.visibility = 'hidden';
    }
    if (!urllist.includes(url)) {
      disableReadIcon();
    }
  } else {
    readlistBox.style.visibility = 'hidden';
  }
};
readLaterFetch();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "tabActivated") {
    readLaterFetch();
    sendResponse({ status: "success" });
  }
});

//添加至或删除稍后读事件
function disableReadIcon() {
  readIcon.classList.remove('rotate_45');
  readIcon.classList.remove('icon_disable');
}
function addReadIcon() {
  readIcon.classList.add('rotate_45');
  readIcon.classList.add('icon_disable');
}
function deleteReadItem(deleteurl) {
  contentDBProceer(objread,'delete',deleteurl);
  readlistIcon.innerText = listnumber - 1;
  listnumber -= 1;
  if (listnumber == 1 && readIcon.classList.contains('rotate_45')) {
    readlistBox.style.visibility = 'hidden';
  }
}
readBox.addEventListener('click', ()=> {
  if (readIndex === 1) {
    readIndex = switchCondition(readIndex);
    readSwitch.innerText = "稍后读";
    disableReadIcon();
    deleteReadItem(websiteInfo.url);
    
  } else {
    readSwitch.innerText = "取消";
    readIndex = switchCondition(readIndex);
    addReadIcon();
    contentDBProceer(objread,'save',websiteInfo);
    readlistIcon.innerText = listnumber + 1;
    listnumber += 1;
  }
})

//禁用2种popup
annoSwitchBox.addEventListener('click', ()=> {
  if (highlightIndex === 1) {
    highlightIndex = switchCondition(highlightIndex);
    annoSwitch.innerText = "禁止标注";
    popup.style.display = '';
    changeManual.style.display = '';
    colorPicker.style.display = '';
    annoSwitchIcon.classList.remove('rotate_90');
    annoSwitchIcon.classList.remove('icon_disable'); 
  } else {
    annoSwitch.innerText = "开启标注";
    highlightIndex = switchCondition(highlightIndex);
    popup.style.display = 'none';
    changeManual.style.display = 'none';
    colorPicker.style.display = 'none';
    annoSwitchIcon.classList.add('rotate_90');
    annoSwitchIcon.classList.add('icon_disable');
  }
})

//禁止链接选择
linkBox.addEventListener('click', ()=> {
  if (linkIndex === 1) {
    linkIndex = switchCondition(linkIndex);
    linkSwitch.innerText = "冻结链接";
    document.querySelectorAll('a').forEach(link => {
      link.style.cursor = '';
      link.style.pointerEvents = '';
    });
    linkIcon.classList.remove('rotate_90');
    linkIcon.classList.remove('icon_disable');
  } else {
    linkSwitch.innerText = "解冻链接";
    linkIndex = switchCondition(linkIndex);
    document.querySelectorAll('a').forEach(link => {
      link.style.cursor = 'text';
      link.style.pointerEvents = 'none';
    });
    linkIcon.classList.add('rotate_90');
    linkIcon.classList.add('icon_disable');
  }
})

//返回标注列表
let annolist;
function getAnnoList (allAnno) {
  const annoList = [];
  allAnno.forEach(anno => {
    if (anno.annotation) {
      annoList.push(anno.annotation);
    }
  })
  return annoList;
}

async function handleAnnotations() {
  try {
    const allAnnotations = await getAllAnnotations();
    return allAnnotations;
  } catch (error) {
    console.error("Error fetching annotations:", error);
  }
}

// 当页面加载完毕时执行标注功能
(async () => {
  annolist = await handleAnnotations();
})();

function autoSwither() {
  const textElements = document.querySelectorAll('p, h1');
  textElements.forEach(element => {
    let textContent = element.innerHTML;
    annolist.forEach(annotation => {
        const trimmedAnnotation = annotation.trim();
        const regex = new RegExp(`\\b(${trimmedAnnotation})\\b`, 'gi');
        textContent = textContent.replace(regex, (match) => {
            return `<span class="highlighted"">${match}</span>`;
        });
    });
    element.innerHTML = textContent;
});
}

//显示标注
let showindex = 0;
let initialmark = 0;

noteSwitchBox.addEventListener('click', (event) => {
  if (showindex === 0 && initialmark === 0) {
    showindex = 1;
    initialmark = 1;
    autoSwither();
    noteSwitchBox.style.backgroundColor = '#fff9e2';
    noteSwitchIcon.classList.add('icon_light');
    icon_light
  } else if (showindex === 1) {
    showindex = 0;
    noteSwitchBox.style.backgroundColor = '';
    noteSwitchIcon.classList.remove('icon_light');
    autoSwitherChange(false);
  } else {
    showindex = 1;
    noteSwitchBox.style.backgroundColor = '#fff9e2';
    noteSwitchIcon.classList.add('icon_light');
    autoSwitherChange(true);
  }
})

function autoSwitherChange(instruction) {
  if (instruction) {
    const highlightedSpans = document.querySelectorAll('span.unhighlighted');
    highlightedSpans.forEach(span => {
      span.className = 'highlighted';
    });
  } else {
    const highlightedSpans = document.querySelectorAll('span.highlighted');
    highlightedSpans.forEach(span => {
      span.className = 'unhighlighted';
    });
  }
}

//返回单一anno的所有信息
function getOneannoinfo (oneanno) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {type: "getOneAnnoInfo",
        anno: oneanno
      }
      , function(response) {
        resolve(response);
      }
    )
  })
}

//获取单一条件内所有值
function getOneInfo (aimtype,content) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {type: "getOneInfo",
        condition: aimtype,
        content: content
      }
      , function(response) {
        resolve(response);
      }
    )
  })
}

//更新数据
function updateAnno1 (annoID, annotype, newvalue) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {type: "updateAnno",
        anno: annoID,
        annotype: annotype,
        newvalue: newvalue
      }
      , function(response) {
        resolve(response);
      }
    )
  })
}

function deleteAnno (annoID) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {type: "deleteAnno",
        annoID: annoID
      }
      , function(response) {
        resolve(response);
      }
    )
  })
}

async function handleRequestUpdate (annoID, annotype, newvalue) {
  const result = await updateAnno1(annoID, annotype, newvalue);
};

//尝试获取该网站标注信息 和 webinfo信息
let savedAnno = null;
let webindex = 0;
let saveWeb = false;

(async function handleRequest() {
  savedAnno = await getOneInfo('url', url);
  if (savedAnno) {
    savedAnno.forEach(anno => {
      const recontext = anno.context;
      const reannotation = anno.annotation;
      const recolor = anno.color;
      const redate = anno.date;
      if (recontext) {
        resetAnno(recontext,reannotation,recolor,redate,anno.index);
      }
    })
    if (savedAnno.length > 0) {
      const dburl = await contentDBProceer(objweb,'getsome',[url]);
      if (dburl.length == 0) {
        contentDBProceer(objweb,'save',websiteInfo);
      }
    }
  } 
})();

//进行第一次标注操作时，查看有无网页信息，没有则补上
async function saveWEB() {
  const dburl = await contentDBProceer(objweb,'getsome',[url]);
  if (dburl.length == 0) {
    contentDBProceer(objweb,'save',websiteInfo);
  }
};

function findTextRange(element, text, textindex, textcontext) {
  const nodeText = element.textContent;
  let index;
  if (textindex) {
    const indextext = nodeText.indexOf(textcontext) + textindex;
    index = indextext;
  } else {
    index = nodeText.indexOf(text);
  }
  let currentIndex = 0;
  const range = document.createRange();
  let nodeindex;
  const textNodes = [];
  function collectTextNodes(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      textNodes.push(node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      node.childNodes.forEach(collectTextNodes);
    }
  }
  collectTextNodes(element);
  for (const textNode of textNodes) {
    const textLength = textNode.textContent.length;
    if (currentIndex + textLength > index) {
      nodeindex = index - currentIndex;
      range.setStart(textNode,nodeindex);
      range.setEnd(textNode,nodeindex + text.length);
      return range;
    }
    currentIndex += textLength;
  }
}
function resetAnno(context, annotation, color, date, index) {
  const targetElement = findSmallestContainingElement(context);
  if (targetElement) {
    const annorange = findTextRange(targetElement, annotation, index, context);
    if (annorange) {
      addAnnoTag(annorange, color, date);
    } else {
      console.warn('未找到 annotation:', annotation);
    }
  } else {
    console.warn('未找到包含 context 的元素');
  }
}

// 辅助函数：找到包含 context 的最小元素
function findSmallestContainingElement(context) {
  const walker = document.createTreeWalker(
    document.body, 
    NodeFilter.SHOW_ELEMENT, 
    {
      acceptNode(node) {
        if (!node.textContent || !node.textContent.trim()) {
          return NodeFilter.FILTER_REJECT; 
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    },
    false
  );

  let smallestElement = null;
  while (walker.nextNode()) {
    const element = walker.currentNode;
    if (element.textContent.includes(context)) {
      let childContains = false;
      for (let child of element.children) {
        if (child.textContent.includes(context)) {
          childContains = true;
          break;
        }
      }
      if (!childContains) {
        smallestElement = element;
        break;
      }
    }
  }
  return smallestElement;
}

//标注功能
let lock = false;
function getAdjustedRange(selectedRange) {
  const startContainer = selectedRange.startContainer;
  const endContainer = selectedRange.endContainer;
  let selectedText = selectedRange.toString();
  // 找到前面和后面的空格数量
  let startOffset = 0;
  while (startOffset < selectedText.length && selectedText[startOffset] === ' ') {
    startOffset++;
  }
  let endOffset = selectedText.length - 1;
  while (endOffset >= 0 && selectedText[endOffset] === ' ') {
    endOffset--;
  }
  if (startOffset > endOffset) {
    return selectedRange;
  }
  const newRange = document.createRange();
  newRange.setStart(startContainer, selectedRange.startOffset + startOffset);
  newRange.setEnd(endContainer, selectedRange.startOffset + endOffset + 1);
  return newRange; 
}

//标注添加事件
function addAnnoEvent(span) {
  span.addEventListener('mouseover', (event) => {
    showPopup(event);
  });
  span.addEventListener('mouseleave', (event) => {
    hidePopup();
  });
}

//标注显示
function addAnnoTag(annorange, annocolor, annoid) {
  if (saveWeb == false) {
    saveWEB();
    saveWeb = true;
  }
  const span = document.createElement('span');
  annorange.surroundContents(span); 
  span.classList.add("contextSaver");
  span.classList.add(annocolor);
  span.id = annoid;
  addAnnoEvent(span);
}

//标注增加
function addAnnotation(info) {
  chrome.runtime.sendMessage(
    {
      type: "addData",
      annoinfo: info
    }
  )
}

// 创建组件-语境面板
function elementOpen(element) {
  element.classList.add('flex');
  void element.offsetHeight;
  element.style.opacity = 1;
  element.classList.remove('nodisplay');
}

function elementClose(element) {
  element.classList.add('nodisplay');
  element.classList.remove('flex');
  element.style.opacity = 0;
  if (element != colorPicker) {
    element.style.display = '';
  }
}

function panelControl(element,condition) {
  if (condition == 'open') {
    elementOpen(element)
  } else if (condition == 'close') {
    elementClose(element)
  }
}

function displayControl(element) {
  element.addEventListener('mouseover', (event) => {
    elementOpen(element);
  });
  element.addEventListener('mouseleave', (event) => {
    if (lock == false && element == popup) {
      elementClose(element);
    } else if (element != popup) {
      elementClose(element);
    }
  });
}

const colorPicker = elementCreator('div', [], 'text-color-picker');
elementClose(colorPicker);
const popup = elementCreator('div',[],'popupmanu');
elementClose(popup);
shadowRoot.appendChild(popup);

const contextborad = elementCreator('div',[],'contextborad');
contextborad.style.display = 'none';
const newmeaning = elementCreator('div',[],'newmeaning');
newmeaning.style.display = 'flex';

const contextlister = elementCreator('div',[],'contextlister');
elementAppender(popup, [contextborad, newmeaning, contextlister]);
shadowRoot.appendChild(colorPicker);

//标注更新面板 changeManual
const changeManual = elementCreator('div',[],'changeManual');
elementClose(changeManual);
shadowRoot.appendChild(changeManual);

displayControl(popup);
displayControl(changeManual);

function addBottomList(item) {
  item.style.order = 3;
  contextlister.appendChild(item);
}

//新添颜色按钮
const colors = ['yellow', 'blue', 'green', 'red', 'purple'];
colors.forEach((color) => {
  const colorButton = elementCreator('button',['color-button',color],color);
  // 绑定点击事件 + 存入新增标注
  colorButton.addEventListener('click', () => {
    let date = Date.now();
    let oneannotationInfo;
    if (selectedRange) {
      addAnnoTag(selectedRange,color,date);

      oneannotationInfo = {
        "annotation":annotation,
        "date": date,
        "url": window.location.href,
        "color": color,
        "title": title,
        "context": context,
        "index": annoindex
      }
      if (annotation) {
        addAnnotation(oneannotationInfo);
      }
      window.getSelection().removeAllRanges();
    }
    panelControl(colorPicker,'close');
  });
  colorPicker.appendChild(colorButton);
});


//已标注内容的popup

//计算位置，防止溢出
function popupLocation(rect) {
  const distanceToRightEdge = window.innerWidth - rect.left;
  popup.style.top = `${rect.bottom + window.scrollY}px`;
  if (distanceToRightEdge < 280) {
    popup.style.left = `${rect.left + window.scrollX - 280 + distanceToRightEdge}px`;
  } else{
    popup.style.left = `${rect.left + window.scrollX}px`;
  }
}

function changeManualLocation(nearestSpan,rect) {
  const actualHeight = nearestSpan.offsetHeight;
  const actualWidth = nearestSpan.offsetWidth;
  const distanceToRightEdge = window.innerWidth - rect.right;
  const distanceToLeftEdge = rect.left;
  changeManual.style.flexDirection = '';
  changeManual.style.top = `${rect.top + window.scrollY - 17.5 + 0.5 * actualHeight}px`;
  if (distanceToRightEdge < 190 && distanceToLeftEdge < 200) {
    changeManual.style.left = `${rect.right + window.scrollX - 190}px`;
    changeManual.style.top = `${rect.top + window.scrollY - actualHeight + 10}px`;
    changeManual.style.flexDirection = 'row-reverse';
  } else {
    if (distanceToRightEdge < 190) {
      changeManual.style.left = `${rect.left + window.scrollX - 185}px`;
      changeManual.style.flexDirection = 'row-reverse';
    } else {
      changeManual.style.left = `${rect.left + window.scrollX + actualWidth}px`;
    }
  } 
}

//重新选择颜色面板
function colorReselect(nearestSpan,aimID,rect) {
  deleteItems(changeManual, '.change-item');
  panelControl(changeManual,'open');
  //删除按钮
  const btnDelete = elementCreator('div',['btn', 'change-item'],'btnDelete');
  const deleteicon = elementCreator('img',['icon']);
  deleteicon.src = chrome.runtime.getURL('images/icons/delete.svg');
  changeManual.appendChild(btnDelete);
  btnDelete.appendChild(deleteicon);
  //删除事件
  deleteicon.addEventListener('click', (event) => {
    deleteAnno(aimID);
    const HTMLContent = nearestSpan.innerHTML; 
    const parent = nearestSpan.parentNode;
    nearestSpan.insertAdjacentHTML('beforebegin', HTMLContent);
    nearestSpan.remove(); 
    const annospans = parent.querySelectorAll('.contextSaver');
    if (annospans) {
      annospans.forEach(annospan => {
        addAnnoEvent(annospan);
      })
    }
  })
  //颜色事件
  let aimColor;
  const classList = nearestSpan.classList;
  colors.forEach(color => {
    if (classList.contains(color)) {
      aimColor = color;
    }
  })
  //颜色按钮
  colors.forEach(color => {
    const colorbtn = elementCreator('div',['color-button',color,'change-item']);
    changeManual.appendChild(colorbtn);
    colorbtn.addEventListener('click', (event) => {
      colors.forEach(cc => {
        if (classList.contains(cc)) {
          nearestSpan.classList.remove(cc);
          nearestSpan.classList.add(color);
          handleRequestUpdate(aimID, 'color', color);
        }
      })
    })
  })
  changeManualLocation(nearestSpan,rect);
}

//对已标注内容的popup 
function showPopup(annoevent) {
  const nearestSpan = annoevent.target.closest('.contextSaver');
  const aimID = nearestSpan.id * 1;
  const rect = nearestSpan.getBoundingClientRect();
  colorReselect(nearestSpan,aimID,rect);
  deleteItems(popup, '.change-item');
  contextborad.style.display = 'none';
  popupLocation(rect);  
  const newmeanInput = elementCreator('input',['change-item','inputbox'],'newmeanInput');
  newmeanInput.type = 'text';
  newmeanInput.placeholder = '新建语义';
  newmeaning.appendChild(newmeanInput);
  newmeaning.style.display = '';
  newmeaning.style.height = '';
  newmeanInput.addEventListener('focus', function() {
    lock = true;
  });
  newmeanInput.addEventListener('blur', function() {
    lock = false;
  });
  newmeanInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      const inputValue = newmeanInput.value;
      handleRequestUpdate(aimID, 'note', inputValue);
      newmeanInput.value = ''; // 清空输入框
      newmeaning.style.display = 'none';
      lock = false;
      hidePopup();
    }
  });

  function itemCreator(info) {
    const infoitem = elementCreator('div',['context-item','change-item']);
    if (info.date == aimID) {
      infoitem.style.display = 'none';
    }
    const infotext = elementCreator('p',['context-text']);
    const annotation = info.annotation;
    const annocontext = info.context;
    let textContent;
    if (info.index) {
      const annoindex = info.index;
      const start = annoindex;
      const end = start + annotation.length;
      textContent = annocontext.slice(0, start) + 
        `<span class="contextSaver ${info.color}">${annocontext.slice(start, end)}</span>` + 
        annocontext.slice(end);
    } else {
      const regex = new RegExp(annotation, 'g');
      textContent = annocontext.replace(regex, (match) => {
        return `<span class="contextSaver ${info.color}"">${match}</span>;`
      });
    }
    infotext.innerHTML = textContent;
    const infosource = elementCreator('div',['flex-row']);
    //语境信息
    const contextdate = elementCreator('p',['contextdate']);
    contextdate.innerText = info.date;
    contextdate.style.display = 'none';
    const infodate = elementCreator('p',['font-small']);
    infodate.innerText = formatTimestamp(info.date);
    const infotitle = elementCreator('a',['font-small']);
    infotitle.href = info.url;
    if (info.title) {
      infotitle.innerText = info.title;
    } else {
      infotitle.innerText = info.url;
    }
    
    elementAppender(infoitem,[infotext,contextdate,infosource])
    elementAppender(infosource,[infodate,infotitle])
    return infoitem
  }
  //header和container创建 [meancontainer,meanheader]
  function headerCreator(info) {
    const meancontainer = elementCreator('div',['meancontainer','change-item']);
    meancontainer.style.order = 2;
    //语义显示和选择修改
    const meanheader = elementCreator('div',['meanheader','flex-row']);
    //左侧选择区
    const meanleft = elementCreator('div',['flex-row','fullwidth']);
    const meaninglabel = elementCreator('label',['custom-checkbox']);
    const checkBox = elementCreator('input',['checkbox']);
    checkBox.type = 'checkbox';
    const checkmark = elementCreator('span',['checkmark']);
    const meaningspan = elementCreator('p',['meaningspan']);
    meaningspan.innerText = info.note;
    //左侧更改区
    const meaningedit = elementCreator('textarea',['meaningedit']);
    meaningedit.rows = '3';
    meaningedit.style.display = 'none';
    meaninglabel.addEventListener('click', ()=> {
      const checklist = popup.querySelectorAll('input');
      if (checkBox.checked == true) {
        checklist.forEach(checker => {
          if (checker != checkBox) {
            checker.checked = false;
          }
        })
        newmeaning.style.display = 'none';
        newmeaning.style.height = 0;

        handleRequestUpdate(aimID,'note',meanheader.innerText);
      } else if (checklist.length > 1) {
        newmeaning.style.display = '';
        handleRequestUpdate(aimID,'note','');
      }
    })

    //右侧工具栏
    const meaningToolBox = elementCreator('div',['flex-row','meaningToolBox']);
    meaningToolBox.style.display = '';
    const toolIcon = elementCreator('div',['icon']);
    const editIcon = elementCreator('div',['icon']);
    const deleteIcon = elementCreator('div',['icon']);
    const toolimg = elementCreator('div',['center']);
    toolimg.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="50" height="50" viewBox="0 0 48 48">
    <path d="M42.074,13.292c-0.193-0.668-1.053-0.866-1.544-0.374c-2.708,2.708-5.228,5.228-5.527,5.527	c-1.69,1.69-4.56,1.481-5.958-0.626c-1.017-1.532-0.718-3.594,0.582-4.894l5.456-5.456c0.492-0.492,0.294-1.351-0.375-1.544	c-3.645-1.051-7.728-0.16-10.601,2.713c-3.041,3.041-3.874,7.442-2.525,11.241C17.484,23.979,7.452,34.011,6.854,34.609	c-1.911,1.911-1.799,5.079,0.336,6.843c1.862,1.537,4.634,1.261,6.341-0.446L28.12,26.417c3.799,1.349,8.2,0.516,11.241-2.525	C42.234,21.02,43.125,16.937,42.074,13.292z"></path>
    </svg>`;
    toolIcon.appendChild(toolimg);

    const editimg = elementCreator('div',['center']);
    editimg.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 24 24">
    <path d="M 19.171875 2 C 18.448125 2 17.724375 2.275625 17.171875 2.828125 L 16 4 L 20 8 L 21.171875 6.828125 C 22.275875 5.724125 22.275875 3.933125 21.171875 2.828125 C 20.619375 2.275625 19.895625 2 19.171875 2 z M 14.5 5.5 L 3 17 L 3 21 L 7 21 L 18.5 9.5 L 14.5 5.5 z"></path>
    </svg>`
    editIcon.appendChild(editimg);

    const deleteimg = elementCreator('div',['center']);
    deleteimg.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 24 24">
    <path d="M 10.806641 2 C 10.289641 2 9.7956875 2.2043125 9.4296875 2.5703125 L 9 3 L 4 3 A 1.0001 1.0001 0 1 0 4 5 L 20 5 A 1.0001 1.0001 0 1 0 20 3 L 15 3 L 14.570312 2.5703125 C 14.205312 2.2043125 13.710359 2 13.193359 2 L 10.806641 2 z M 4.3652344 7 L 5.8925781 20.263672 C 6.0245781 21.253672 6.877 22 7.875 22 L 16.123047 22 C 17.121047 22 17.974422 21.254859 18.107422 20.255859 L 19.634766 7 L 4.3652344 7 z"></path>
    </svg>`
    deleteIcon.appendChild(deleteimg);
    
    //添加tool事件
    deleteIcon.addEventListener('click', (event)=> {
      const aimheader = event.target.closest('.meancontainer');
      const allcontexts = aimheader.querySelectorAll('.context-item');
      if (allcontexts) {
        allcontexts.forEach(contextItem => {
          const contextID = contextItem.querySelector('.contextdate').innerText * 1;
          handleRequestUpdate(contextID,'note','');
          addBottomList(contextItem);
        })
      }
      aimheader.remove();
    })

    meaningedit.addEventListener('focus', function() {
      lock = true;
    });
    meaningedit.addEventListener('blur', function() {
      lock = false;
    });
    
    meaningedit.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' && event.ctrlKey) {
        lock = false;
        const inputValue = meaningedit.value;
        const aimheader = event.target.closest('.meancontainer');
        const allcontexts = aimheader.querySelectorAll('.context-item');
        if (allcontexts) {
          allcontexts.forEach(contextItem => {
            const contextID = contextItem.querySelector('.contextdate').innerText * 1;
            handleRequestUpdate(contextID,'note',inputValue);
          })
        }
        meaningspan.innerText = inputValue;
        meaninglabel.style.display = 'flex';
        meaningedit.style.display = 'none';
        meaningToolBox.style.display = '';
      }
    });
    //一键修改语义
    editIcon.addEventListener('click', (event)=> {
      popup.style.display = 'flex';
      const meanheader = event.target.closest('.meanheader');
      if (meanheader) {
        const meaningedit = meanheader.querySelector('.meaningedit');
        const meaninglabel = meanheader.querySelector('.custom-checkbox');
        const editwidth = meaninglabel.offsetWidth;
        const meaningspan = meanheader.querySelector('.meaningspan');
        meaningedit.style.display = 'flex';
        meaningedit.value = meaningspan.innerText;
        meaningedit.style.width = `${editwidth + 80}px`;
        meaningedit.style.maxWidth = `${window.innerWidth - parseFloat(popup.style.left) - 45}px`;
        meaninglabel.style.display = 'none';
        meaningToolBox.style.display = 'none';
      }
    })
    
    elementAppender(meaningToolBox,[toolIcon,editIcon,deleteIcon])
    elementAppender(meaninglabel,[checkBox,checkmark,meaningspan]);
    elementAppender(meanheader,[meanleft,meaningToolBox]);
    elementAppender(meanleft,[meaninglabel,meaningedit]);

    contextlister.appendChild(meancontainer);
    meancontainer.appendChild(meanheader);

    return [meancontainer,meanheader]
  }

  //返回Info列表并生成语境面板
  (async function handleOneanno() {
    const meaninglist = [];
    const oneinfo = await getOneannoinfo(aimID);
    if (oneinfo.length > 1) {
      contextborad.innerHTML = `
      <p>标注 · ${oneinfo.length}</p>
      `;
      contextborad.style.display = 'flex';
    }
    //获取所有语义信息，创建语义container
    oneinfo.forEach(info => {
      const newitem = itemCreator(info);
      if (!info.note) {
        addBottomList(newitem);
      } else {
        let meancontainer;
        let meanheader;
        if (!meaninglist.includes(info.note)) {
          const headertwo = headerCreator(info);
          meancontainer = headertwo[0];
          meanheader = headertwo[1];
          meaninglist.push(info.note);
          if (meancontainer) {
          }
          meancontainer.appendChild(newitem);
        } else if (meaninglist.includes(info.note)) {
          popup.querySelectorAll('.meanheader').forEach(header => {
            if (header.innerText == info.note) {
              meancontainer = header.parentElement;
              meanheader = header;
            }
          })
          meancontainer.appendChild(newitem);
        }
        if (aimID == info.date) {
          meanheader.parentElement.style.order = 1;
          newmeaning.style.display = 'none';
          meanheader.querySelector('input').checked = true;
        } 
      }

    })
    //只有一个header的特殊情况，不显示checkbox
    if (meaninglist) {
      const IDs = contextlister.querySelectorAll('.meancontainer .contextdate');
      if (meaninglist.length == 1) {
        IDs.forEach(ID => {
          if (ID.innerText == aimID) {
            contextlister.querySelector('.checkmark').style.display = 'none';
            contextlister.querySelector('.checkbox').remove();
            newmeaning.style.display = 'none';
          }
        })
      }
    }
  })();
  panelControl(popup,'open');
}

function hidePopup() {
  panelControl(changeManual,'close');
  if (lock == false) {
    panelControl(popup,'close');
  }
}

function getAnchorPositionInParent(anchorNode, anchorOffset, parentElement) {
  let currentOffset = 0;
  // 递归处理，获取所有文本节点的内容
  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node === anchorNode) {
        currentOffset += anchorOffset;
        return true; 
      } else {
        currentOffset += node.textContent.length;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      for (let child of node.childNodes) {
        if (processNode(child)) {
          return true; 
        }
      }
    }
    return false; 
  }

  for (let child of parentElement.childNodes) {
    if (processNode(child)) {
      break; 
    }
  }

  return currentOffset;
}
// 划词选择事件mouseup + 句子提取
// 确定选择范围-确定最小所在元素-获取语境段落文本-获取所在语境句子-确定选择文字在句子中出现次数及位数
document.addEventListener('mouseup', () => {
  const selectedText = window.getSelection();
  const annotationraw = selectedText.toString();
  annotation = annotationraw.trim();
  
  if (annotation.length > 0) {
    panelControl(colorPicker,'open');
    selectedRange = selectedText.getRangeAt(0);
    let commoncontainer = selectedRange.commonAncestorContainer;
    let containerElement = selectedRange.startContainer;
    let targetElement = null;
    while (containerElement) {
      if (['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SMALL', 'DT'].includes(containerElement.nodeName)) {
        targetElement = containerElement;
        break;
      }
      if (containerElement.nodeName === 'DIV') {
        targetElement = containerElement;
        break;
      }
      containerElement = containerElement.parentNode;
    }
    let startIndex;
    const textstart = selectedText.anchorOffset;
    const textend = selectedText.focusOffset;
    let indexstart;
    if (textstart > textend) {
      indexstart = textend;
    } else {
      indexstart = textstart;
    }
    
    if (commoncontainer != containerElement) {
      const currentOffset = getAnchorPositionInParent(commoncontainer,indexstart,containerElement);
      startIndex = currentOffset;
    } else {
      startIndex = selectedText.anchorOffset;
    }
    if (containerElement) {
      const containerText = containerElement.textContent;
      const selectedText = selectedRange.toString();
      const monthAbbreviations = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May.', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.', 'a.k.a.'];
      let sentenceStart = startIndex;
      while (sentenceStart > 0 && !/[.!?。？！]/.test(containerText[sentenceStart - 1])) {
        sentenceStart--;
      }
      
      // 向右扩展找到句子的结束
      let sentenceEnd = startIndex + selectedText.length;
      while (sentenceEnd < containerText.length) {
        const char = containerText[sentenceEnd];
        const possibleSentence = containerText.substring(sentenceStart, sentenceEnd + 1).trim();
        if (/[.!?。？！]/.test(char)) {
          if (!monthAbbreviations.some(abbr => possibleSentence.endsWith(abbr))) {
            while (sentenceEnd < containerText.length && /[.!?。？！\s”"')\]]/.test(containerText[sentenceEnd])) {
              sentenceEnd++;
            }
            break;
          }
        }
        sentenceEnd++;
      }

      // 提取句子
      function countLeadingSpaces(sentence) {
        let spaceCount = 0;
        for (let char of sentence) {
          if ([' ','\t','\n','\r'].includes(char)) {
            console.log('char',char);
            spaceCount++;
          } else {
            break;
          }
        }
        return spaceCount;
      }
      const sentence = containerText.substring(sentenceStart, sentenceEnd);
      const leadingSpaces = countLeadingSpaces(sentence);
      const spaceofanno = countLeadingSpaces(annotationraw);
      context = sentence.trim();
      annoindex = startIndex - sentenceStart - leadingSpaces + spaceofanno;
    }

    // 组件定位
    const rect = selectedRange.getBoundingClientRect();
    colorPicker.style.top = `${rect.bottom + window.scrollY + 5}px`;
    colorPicker.style.left = `${rect.left + window.scrollX}px`;
  }
});

// 移除颜色选择器
document.addEventListener('mousedown', (event) => {
  if (event.target != contextsaverElement || !selectedRange) {
    panelControl(colorPicker,'close');
  }
});
