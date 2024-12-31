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


// 监听标签页激活
chrome.tabs.onActivated.addListener((activeInfo) => {
  sendTabActivatedMessage(activeInfo.tabId);
});

// 向指定 tab 发送激活消息
function sendTabActivatedMessage(tabId) {
  chrome.tabs.sendMessage(tabId, { action: "tabActivated" }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn("消息发送失败，可能目标标签页没有注入 content.js");
    }
  });
}
  
//创建打开全局数据库
let db;
let transaction;
let objectStore;

//获取(创建)标注数据库
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ContextSaver", 1);
    request.onupgradeneeded = (event) => {
      db = event.target.result;
      if (!db.objectStoreNames.contains("annotations")) {
        const store = db.createObjectStore("annotations", { keyPath: "date"});
        store.createIndex("context", "context", { unique: false });
        store.createIndex("annotation", "annotation", { unique: false });
        store.createIndex("url", "url", { unique: false });
        store.createIndex("title", "title", { unique: false });
        store.createIndex("color", "color", { unique: false });
        store.createIndex("note", "note", { unique: false });
        store.createIndex("star", "star", { unique: false });
        store.createIndex("location", "location", { unique: false });
        store.createIndex("date", "date", { unique: true });
        store.createIndex("index", "index", { unique: false });
      } 
    };
    
    request.onsuccess = (event) => {
      db = event.target.result;  
      resolve(db);
    };
    
    request.onerror = (event) => {
      console.error("Failed to store annotation:", event.target.error);
      reject(event.target.error);
    }
  });
}


//获取(创建)网站信息库
//objectname ['readlater','webinfo']
function openContentDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ContentDB", 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('readlater')) {
        const store = db.createObjectStore('readlater', { keyPath: "url"});
        store.createIndex("url", "url", { unique: true });
        store.createIndex("title", "title", { unique: false });
        store.createIndex("date", "date", { unique: false });
        store.createIndex("icon", "icon", { unique: false });
        store.createIndex("img", "img", { unique: false }); 
        store.createIndex("lan", "lan", { unique: false });
      }
      if (!db.objectStoreNames.contains('webinfo')) {
        const store = db.createObjectStore('webinfo', { keyPath: "url"});
        store.createIndex("url", "url", { unique: true });
        store.createIndex("title", "title", { unique: false });
        store.createIndex("date", "date", { unique: false });
        store.createIndex("icon", "icon", { unique: false });
        store.createIndex("img", "img", { unique: false }); 
        store.createIndex("lan", "lan", { unique: false });
      }
    }
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };
    
    request.onerror = (event) => {
      console.error("Failed to open ContentDB:", event.target.error);
      reject(event.target.error);
    }
  });
}
openDatabase();
openContentDatabase();

//获取所有数据
function getAllAnnotations(callback) {
  const getallobjectStore = db
    .transaction("annotations", "readonly")
    .objectStore("annotations");
  const getallRequest = getallobjectStore.getAll();
  getallRequest.onsuccess = (event) => {
    const allAnnotations = event.target.result;
    callback(allAnnotations);
  };
  getallRequest.onerror = (event) => {
    console.error("获取数据失败:", event.target.error);
    return `获取数据失败:${event.target.error}`
  };
}

function getAnnonamelist(aimtype) {
  return new Promise((resolve, reject) => {
    const getallobjectStore = db
      .transaction("annotations", "readonly")
      .objectStore("annotations");
    const nameIndex = getallobjectStore.index(aimtype);
    const names = [];
    const cursorRequest = nameIndex.openCursor();
    cursorRequest.onsuccess = function(event) {
      const cursor = event.target.result;
      if (cursor) {
        const anno = cursor.value[aimtype];
        if (anno && !names.includes(anno)) {
            names.push(cursor.value[aimtype]);
          }
          cursor.continue();
      } else {
          resolve(names);
      }
    };
    cursorRequest.onerror = function(event) {
        reject('Error retrieving customer names from index');
    };
  });
}

//由id找anno
function getAnnoFromID(annoID) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("annotations", "readonly");
    const objectStore = transaction.objectStore("annotations");

    const request = objectStore.get(annoID);

    request.onsuccess = function(event) {
      const result = event.target.result;
      if (result) {
        resolve(result.annotation); 
      } else {
        reject("没有找到对应的 annotation");
      }
    };
    request.onerror = function(event) {
      reject("查询过程中发生错误");
    };
  });
}

//通过排序返回单个anno数据，为了获得插件的最早使用时间
function getFirstAnno() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("annotations", "readonly");
    const objectStore = transaction.objectStore("annotations");

    const firstRequest = objectStore.openCursor();
    let firstAnno = null;
    firstRequest.onsuccess = function(event) {
      const cursor = event.target.result;
      if (cursor) {
        firstAnno = cursor.value;
        resolve(firstAnno);
      } else {
        reject("没有找到任何 annotation");
      }
    };
  });
}

//找到一个单词所有的语境信息
function getOneInfo(condition, content) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("annotations", "readonly");
    const objectStore = transaction.objectStore("annotations");
    const annoIndex = objectStore.index(condition);
    const oneinfo = [];
    const cursorRequest = annoIndex.openCursor(IDBKeyRange.only(content));

    cursorRequest.onsuccess = function(event) {
      const cursor = event.target.result;
      if (cursor) {
        oneinfo.push(cursor.value);
        cursor.continue();
      } else {
        resolve(oneinfo);
      }
    };
    cursorRequest.onerror = function() {
      reject("Error retrieving annotation information");
    };
  });
}

//找到网页的第一个anno信息
function getUrlFirstAnno(condition,content) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("annotations", "readonly");
    const objectStore = transaction.objectStore("annotations");
    const aimIndex = objectStore.index(condition);
    const range = IDBKeyRange.only(content);
    const request = aimIndex.get(range);
    request.onsuccess = function(event) {
      const cursor = event.target.result;
      if (cursor) {
        resolve(cursor);
      } else {
        resolve('');
      }
    };
    request.onerror = function() {
      reject(`getUrlFirstAnno 失败${error}`);
    };
  });
}

//找到某事件范围内，某一type的内容list
function getOneBound(bound, aimtype, uniquelist) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("annotations", "readonly");
    const objectStore = transaction.objectStore("annotations");
    const annoIndex = objectStore.index('date');
    const oneinfo = [];
    const cursorRequest = annoIndex.openCursor(IDBKeyRange.bound(bound[0], bound[1]));
    cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const aimvalue = cursor.value[aimtype];
          if (uniquelist === true && !oneinfo.includes(aimvalue)) {
            oneinfo.push(aimvalue);
          }
          if (uniquelist === false) {
            oneinfo.push(aimvalue);
          }
          cursor.continue();
        } else {
          resolve(oneinfo);
        }
    };
    cursorRequest.onerror = function() {
      reject("Error retrieving annotation information");
    };
  });
}

//更新anno信息
function updateAnno(annoID, annotype, newvalue) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("annotations", "readwrite");
    const objectStore = transaction.objectStore("annotations");

    const request = objectStore.get(annoID * 1);
    
    request.onsuccess = function(event) {
      const oldanno = event.target.result;
      if (oldanno) {
        oldanno[annotype] = newvalue;
        const updateRequest = objectStore.put(oldanno);
        updateRequest.onsuccess = function() {
          resolve("更新成功！(●'◡'●)"); 
        };

        updateRequest.onerror = function(event) {
          reject("更新过程中发生错误");
        };
      } else {
        reject("没有找到对应的 annotation");
      }
    };
    request.onerror = function(event) {
      reject("查询过程中发生错误");
    };
  });
}

//删除anno信息
function deleteAnno(annoID) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("annotations", "readwrite");
    const objectStore = transaction.objectStore("annotations");
    const request = objectStore.delete(annoID * 1);
    request.onsuccess = function(event) {
      resolve("删除成功！(●'◡'●)"); 
    };
    request.onerror = function(event) {
      reject("查询过程中发生错误");
    };
  });
}

//objectname ['readlater','webinfo'] 用url返回web信息
function contentDBProceer(webdb, objname, processtype, processcontent) {
  return new Promise((resolve, reject) => {
    if (processtype === 'save') {
      const transaction = webdb.transaction(objname, "readwrite");
      const objectStore = transaction.objectStore(objname);
      const request = objectStore.add(processcontent);
      request.onsuccess = function(event) {
        resolve("添加成功！(●'◡'●)"); 
      };
      request.onerror = function(event) {
        reject("查询过程中发生错误");
      };
    } else if (processtype === 'saveall') {
      const transaction = webdb.transaction(objname, "readwrite");
      const objectStore = transaction.objectStore(objname);
      const promises = processcontent.map(anno => {
        return new Promise((resolve, reject) => {
          const request = objectStore.add(anno);
          request.onsuccess = function(event) {
            resolve();
          };
          request.onerror = function(event) {
            reject("查询过程中发生错误");
          };
        });
      });
      Promise.all(promises)
        .then(() => {
          resolve("所有数据已成功添加！(●'◡'●)");
        })
        .catch(err => {
          reject(err);
        });
    } else if (processtype === 'delete') {
      const transaction = webdb.transaction(objname, "readwrite");
      const objectStore = transaction.objectStore(objname);
      const request = objectStore.delete(processcontent);
      request.onsuccess = function(event) {
        resolve("删除成功！(●'◡'●)"); 
      };
      request.onerror = function(event) {
        reject("查询过程中发生错误");
      };
      //获取所有网站数据
    } else if (processtype === 'get') {
      const transaction = webdb.transaction(objname, "readonly");
      const objectStore = transaction.objectStore(objname);
      const request = objectStore.getAll();
      request.onsuccess = function(event) {
        const laterList = event.target.result;
        resolve(laterList); 
      };
      request.onerror = function(event) {
        reject("查询过程中发生错误");
      };
      //返回特定url的webinfo
    } else if (processtype === 'getsome') {
      const transaction = webdb.transaction(objname, "readonly");
      const objectStore = transaction.objectStore(objname);
      const urlIndex = objectStore.index('url');
      const request = urlIndex.openCursor(IDBKeyRange.only(processcontent));
      request.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
          resolve(cursor.value);
        } else {
          resolve('');
        }
      };
      request.onerror = function(event) {
        reject("查询过程中发生错误");
      };
    }
  });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type === "getData") {
    openDatabase().then((db) => {
      if (db) {
       getAllAnnotations(function(allAnnotations) {
         sendResponse(allAnnotations);
       });
      }
    }).catch((error) => {
      sendResponse("getData链接数据库失败");
    });
    return true;
  }

  //返回所有不重复的标注的列表
  if (request.type === "getAnnonamelist") {
    const aimtype = request.aimtype;
    (async function handleRequest() {
      try {
        const db = await openDatabase();
        if (db) {
          const list = await getAnnonamelist(aimtype);
          sendResponse(list);
        }
      } catch (error) {
        sendResponse(`getAnnonamelist失败${error}`)
      }
    })();

    return true;
  }

  //用date id找到一个anno所有的语境信息
  if (request.type === "getOneAnnoInfo") {
    const annoid = request.anno;
    const condition = 'annotation';
    (async function handleRequest() {
      try {
        const db = await openDatabase();
        if (db) {
          const anno = await getAnnoFromID(annoid);
          const oneannolist = await getOneInfo(condition,anno);
          sendResponse(oneannolist);
        }
      } catch (error) {
        sendResponse(`getOneAnnoInfo失败${error}`)
      }
    })();

    return true;
  }

  //查找一个网站的所有的语境信息
  if (request.type === "getOneInfo") {
    const webURL = request.content;
    const condition = request.condition;
    (async function handleRequest() {
      try {
        const db = await openDatabase();
        if (db) {
          const oneannolist = await getOneInfo(condition,webURL);
          sendResponse(oneannolist);
        }
      } catch (error) {
        sendResponse(`getOneInfo失败${error}`)
      }
    })();
    return true;
  }

  //查找所有网站的第一个anno信息，返回[]
  if (request.type === "getUrlFirstAnno") {
    const aimtype = request.aimtype;
    (async function handleRequest() {
      try {
        const db = await openDatabase();
        if (db) {
          const urllist = await getAnnonamelist(aimtype);
          let urlannolist = [];
          if (urllist) {
            for (const url of urllist) { 
              const urlanno = await getUrlFirstAnno('url',url); 
              urlannolist.push(urlanno);
            }
          }
          sendResponse(urlannolist);
        }
      } catch (error) {
        sendResponse(`getUrlFirstAnno 失败${error}`)
      }
    })();

    return true;
  }
  
  //筛查一个范围内的所有anno信息
  if (request.type === "getOneBound") {
    const bound = request.bound;
    const aimtype = request.aimtype;
    const uniquelist = request.uniquelist;
    (async function handleRequest() {
      try {
        const db = await openDatabase();
        if (db) {
          const oneannolist = await getOneBound(bound,aimtype,uniquelist);
          sendResponse(oneannolist);
        }
      } catch (error) {
        sendResponse(`getOneBound失败${error}`)
      }
    })();
    return true;
  }

  //筛查一个范围内的所有anno信息
  if (request.type === "getFirstAnno") {
    (async function handleRequest() {
      try {
        const db = await openDatabase();
        if (db) {
          const firstanno = await getFirstAnno();
          sendResponse(firstanno);
        }
      } catch (error) {
        sendResponse(`getFirstAnno 失败${error}`)
      }
    })();
    return true;
  }

  if (request.type === "updateAnno") {
    const annoID = request.anno;
    const annotype = request.annotype;
    const newvalue = request.newvalue;
    (async function handleRequest() {
      try {
        const db = await openDatabase();
        if (db) {
          const result = await updateAnno(annoID, annotype, newvalue);
          sendResponse(result);
        }
      } catch (error) {
        sendResponse(`getOneInfo失败${error}`)
      }
    })();
    return true;
  }

  if (request.type === "deleteAnno") {
    const annoID = request.annoID;
    (async function handleRequest() {
      try {
        const db = await openDatabase();
        if (db) {
          const result = await deleteAnno(annoID);
          sendResponse(result);
        }
      } catch (error) {
        sendResponse(`deleteAnno失败${error}`)
      }
    })();
    return true;
  }

  if (request.type === "addData") {
    openDatabase().then((db) => {
      if (db) {
        const addObjectStore = db
          .transaction("annotations", "readwrite")
          .objectStore("annotations");
        const annoname = request.annoinfo.annotation;
        const addRequest = addObjectStore.add(request.annoinfo);
        addRequest.onsuccess = (event) => {
          sendResponse(`已经存入${annoname}`);
        };
        addRequest.onerror = (event) => {
          console.error("Error adding data:", event.target.error);
          sendResponse(`存入${annoname}失败，问题：${event.target.error}`);
        };
      }
    }).catch((error) => {
      sendResponse(`Database not opened yet, unable to add data. ${error}`);
    });
    return true; 
  }

  //处理稍后读数据库
  //objectname ['readlater','webinfo']
  if (request.type === "contentDBProceer") {
    const objname = request.objName;
    const processtype = request.processType;
    const processcontent = request.processContent;
    (async function handleRequest() {
      try {
        const contentdb = await openContentDatabase();
        if (contentdb) {
          const result = await contentDBProceer(contentdb,objname, processtype, processcontent);
          sendResponse(result);
        }
      } catch (error) {
        sendResponse(`contentDBProceer 失败${error}`)
      }
    })();
    return true;
  }

});