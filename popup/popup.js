
//返回anno所有数据
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

function getAllAnnoData () {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: "getData",
      }
      , function(response) {
        resolve(response);
      }
    );
  });
}


function getAllAnnotations (aimtype) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: "getAnnonamelist",
        aimtype: aimtype
      }
      , function(response) {
        resolve(response);
      }
    );
  });
}

function getOneBound (bound,aimtype,uniquelist) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: "getOneBound",
        bound:bound,
        aimtype: aimtype,
        uniquelist: uniquelist
      }
      , function(response) {
        resolve(response);
      }
    );
  });
}

function getFirstAnno () {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: "getFirstAnno"
      }
      , function(response) {
        resolve(response);
      }
    );
  });
}

async function handleAnnotations(aimtype) {
  try {
    const annolist = await getAllAnnotations(aimtype);
    return annolist;
  } catch (error) {
    console.error("Error fetching annotations:", error);
  }
}

async function handleAnnoBoundInfo(bound,aimtype,uniquelist) {
  try {
    const annolist = await getOneBound(bound,aimtype,uniquelist);
    return annolist;
  } catch (error) {
    console.error("Error fetching annotations:", error);
  }
}

function addAnnotation(info) {
  chrome.runtime.sendMessage(
    {
      type: "addData",
      annoinfo: info
    }
  )
}

document.addEventListener("DOMContentLoaded", async function() {
  await fetchAllData();
});

//时间类工具函数
function getTodayTimeBound() {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0).getTime();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime();
  return [startOfDay,endOfDay]
}

function getTodayDate() {
  const date = new Date();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 月份从0开始
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}-${day}`;
}

function calculateDays(oldTimestamp) {
  const today = new Date();
  const todayTimestamp = today.getTime();
  const diffTimestamp = todayTimestamp - oldTimestamp;
  const days = Math.floor(diffTimestamp / (1000 * 60 * 60 * 24));
  return days
}

//页面
async function fetchAllData() {
  //使用日期至今总共天数
  const firstanno = await getFirstAnno();
  let firsttimestamp;
  let lastdays;
  if (typeof firstanno !== 'string') {
    firsttimestamp = firstanno.date;
    lastdays = calculateDays(firsttimestamp);
  } else {
    lastdays = 0;
  }
  const lastDays = document.querySelector('.lastdays');
  lastDays.innerText = `${lastdays} 天`;


  //今日月份日期
  const todayDate = document.querySelector('.today-date');
  const todayDateNumber = getTodayDate();
  todayDate.innerText = todayDateNumber;
  //今日时间timestamp范围
  const todayBound = getTodayTimeBound();
  //所有不重复标注数据
  const allAnnoNumber = await handleAnnotations('annotation');
  const allUrlNumber = await handleAnnotations('url');
  const todayAnnoNumber = await handleAnnoBoundInfo(todayBound, 'annotation', false);
  const todayUrlNumber = await handleAnnoBoundInfo(todayBound, 'url', true);

  function addNumberHTML(element, list) {
    if (list) {
      const allnumber = list.length;
      const number = document.querySelector(element);
      number.innerHTML = allnumber;
    } else {
      number.innerHTML = '暂无数据';
    }
  }
  addNumberHTML('.alldata .annonumber .number',allAnnoNumber);
  addNumberHTML('.alldata .urlnumber .number',allUrlNumber);
  addNumberHTML('.todaydata .annonumber .number',todayAnnoNumber);
  addNumberHTML('.todaydata .urlnumber .number',todayUrlNumber);


}

//工具栏显示控制
let settingindex = 'close';
const settingbtn = document.querySelector('.logo .btn');
const settingpanel = document.querySelector('.setting-panel');
settingpanel.style.display = 'none';
// settingpanel.style.height = `0px`;
// settingpanel.style.opacity = 0;
settingbtn.addEventListener('click', ()=> {
  displayControl();
})

function displayControl() {
  if (settingindex == 'close') {
    settingpanel.style.display = '';
    settingindex = 'open';
  } else {
    settingpanel.style.display = 'none';
    settingindex = 'close';
  }
}

//提示冒泡
const noticeBox = document.querySelector('.notice-top');
const noticeText = document.querySelector('.notice-text p');

function showNotice(text) {
  noticeText.innerText = text;
  noticeBox.style.opacity = 1;
  noticeBox.style.top = `17px`;
  setTimeout(() => {
    noticeBox.removeAttribute('style');
  }, 1500);
}

//导出导入功能
const exportBtn = document.getElementById('export-data');
const importBtn = document.getElementById('import-data');

//导出函数
function exportDataAsJSON(data) {
  const jsonData = JSON.stringify(data, null, 2); 
  return jsonData
}

function downloadInBrowser(url,name) {
  chrome.downloads.download({
    url: url,
    filename: name,  // 自定义文件名
    saveAs: false   // 询问用户保存路径
  });
}

function data2url(rawdata) {
  const jsondata = exportDataAsJSON(rawdata);
  const blob = new Blob([jsondata], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  return url
}

exportBtn.addEventListener('click', ()=> {
  //导出文件
  getAllAnnoData().then((allanno)=> {
    const url = data2url(allanno);
    downloadInBrowser(url,'contextsaver_export_anno.json');
    //导出后进行提示
    showNotice(`成功导出标注数据！共${allanno.length}条`);
  })
  setTimeout(() => {
    contentDBProceer(objweb,'get').then((webdata)=> {
      const url = data2url(webdata);
      downloadInBrowser(url,'contextsaver_export_web.json');
      showNotice(`成功导出网站数据！共${webdata.length}条`);
    })
  }, 2000);

})

importBtn.addEventListener('click', ()=> {
  //导入文件
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json'; // 限制文件类型为 JSON 或文本文件
  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    function wrongDocument() {
      showNotice('文件内容不匹配，请检查');
    }
    if (file) {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = function () {
        try {
          const data = JSON.parse(reader.result);
          //判断是否为正确文件
          if (Array.isArray(data)) {
            let inputanno = [];
            let inputweb = [];
            data.forEach((item, index) => {
              //分情况导入
              if ('annotation' in item) {
                if (item.annotation && item.date && item.color && item.context) {
                  //标注导入
                  inputanno.push(item);
                } 
              } else {
                if ('url' in item) {
                  if (item.url && item.date){
                    //web导入
                    inputweb.push(item);
                  }
                }
              }
            })
            
            if (inputanno.length == 0 && inputweb.length == 0) {
              wrongDocument();
            } else {
              if (inputanno.length > 0) {
                inputanno.forEach(anno => {
                  addAnnotation(anno);
                })
                showNotice(`已导入${inputanno.length}个标注`);
              }
              if (inputweb.length > 0) {
                contentDBProceer(objweb, 'saveall', inputweb);
                showNotice(`已导入${inputweb.length}个网页信息`);
              }
            }

          } else {
            wrongDocument();
          }
        } catch (error) {
          console.error('JSON 解析失败：', error);
          showNotice('导入失败，文件格式错误！');
        }
      };
    }
  });
  fileInput.click();
})
