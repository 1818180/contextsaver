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

//工具函数
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

function moveAtribute(elementlist, atritype) {
  elementlist.forEach(element => {
    element.removeAttribute(atritype);
  })
}

//标注列表返回数量信息
function annolist2number(annolist) {
  const allnumber = annolist.length;
  let yellowNum = 0;
  let blueNum = 0;
  let greenNum = 0;
  let redNum = 0;
  let purpleNum = 0;
  annolist.forEach(anno => {
    if (anno.color === 'yellow') {
      yellowNum += 1;
    }
    if (anno.color === 'blue') {
      blueNum += 1;
    }
    if (anno.color === 'green') {
      greenNum += 1;
    }
    if (anno.color === 'red') {
      redNum += 1;
    }
    if (anno.color === 'purple') {
      purpleNum += 1;
    }
  })
  const numberlist = [yellowNum, blueNum, greenNum, redNum, purpleNum];
  const totalnumber = allnumber;
  return [numberlist,totalnumber]
}

//数字时间函数

//获取已知范围内的整数随机数
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//获取今日所在一周内的时间戳范围
function thisWeekTimeSpan(timestamp) {
  const inputDate = new Date(timestamp);
  const today = inputDate.getDay();
  const dayOffset = today === 0 ? 6 : today - 1; 

  const weekStart = new Date(inputDate);
  weekStart.setDate(inputDate.getDate() - dayOffset);
  weekStart.setHours(0, 0, 0, 0); 

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); 
  weekEnd.setHours(23, 59, 59, 999); 

  const weekstartsta = weekStart.getTime();
  const weekendstam = weekEnd.getTime();
  const weekstartnum = getTodayDate(weekstartsta);
  const weekendnum = getTodayDate(weekendstam);

  return {
      'stamptype': [weekstartsta, weekendstam],
      'numbertype': [weekstartnum, weekendnum]
  };
}

//获取今日时间戳范围
function getDayTimeBound(timestamp) {
  const date = new Date(timestamp);
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).getTime();
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).getTime();
  return [startOfDay, endOfDay];
}

//获取今日数字时间
function getTodayDate(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  if (year == new Date().getFullYear()) {
    return `${month}-${day}`;
  } else {
    return `${year}-${month}-${day}`;
  }
}

//对返回的object列表进行加工,返回周dict和列表
function sortUrlList(urllist, sorttype) {
  const sortlist = {};
  const startlist = [];
  urllist.forEach(urlobject => {
    const dateorigin = urlobject.date;
    let satrtdate;
    if (sorttype == 'day') {
      satrtdate = getDayTimeBound(dateorigin)[0];
    } else {
      satrtdate = thisWeekTimeSpan(dateorigin).stamptype[0];
    }
    if (!sortlist[satrtdate]) {
      sortlist[satrtdate] = [];
    }
    sortlist[satrtdate].push(urlobject);
    
    if (!startlist.includes(satrtdate)) {
      startlist.push(satrtdate);
    }
  })
  return [sortlist,startlist.sort((a, b) => a - b)]
}

function findMaxInMinList(aimnumber, numlist) {
  const minlist = [];
  numlist.forEach(num => {
    num < aimnumber && minlist.push(num);
  })
  return minlist[minlist.length - 1]
}
function findMinInMaxList(aimnumber, numlist) {
  const maxlist = [];
  numlist.forEach(num => {
    num > aimnumber && maxlist.push(num);
  })
  return maxlist[0]
}

//请求该网站所有数据数据
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

function getUrlFirstAnno (aimtype) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {type: "getUrlFirstAnno",
        aimtype: aimtype,
      }
      , function(response) {
        resolve(response);
      }
    )
  })
}

async function fetchUrlAnno() {
  urlAnnolist = await getUrlFirstAnno('url');
  return urlAnnolist
}


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
//html元素获取
function elementShowSwitch(elementlist, showcondition) {
  elementlist.forEach(el => {
    if (showcondition == 'none') {
      el.style.display = 'none';
    } else if (showcondition == 'no-none') {
      el.style.display = '';
    } else if (showcondition == 'hidden') {
      el.style.visibility = 'hidden';
    } else if (showcondition == 'no-hidden') {
      el.style.visibility = '';
    }
  })
}
//日期选择面板
let dateoneday;
let dateoneweek;
let urlAnnolist;
const todaydate = getTodayDate(Date.now());

//素材
const todayicon = `<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="50" height="50" viewBox="0 0 48 48">
  <path d="M 12.5 6 C 8.9280619 6 6 8.9280619 6 12.5 L 6 35.5 C 6 39.071938 8.9280619 42 12.5 42 L 35.5 42 C 39.071938 42 42 39.071938 42 35.5 L 42 12.5 C 42 8.9280619 39.071938 6 35.5 6 L 12.5 6 z M 12.5 9 L 35.5 9 C 37.450062 9 39 10.549938 39 12.5 L 39 14 L 9 14 L 9 12.5 C 9 10.549938 10.549938 9 12.5 9 z M 9 17 L 39 17 L 39 35.5 C 39 37.450062 37.450062 39 35.5 39 L 12.5 39 C 10.549938 39 9 37.450062 9 35.5 L 9 17 z M 31.541016 20.984375 A 1.50015 1.50015 0 0 0 30.384766 21.496094 L 22.441406 30.320312 L 18.560547 26.439453 A 1.50015 1.50015 0 1 0 16.439453 28.560547 L 21.439453 33.560547 A 1.50015 1.50015 0 0 0 23.615234 33.503906 L 32.615234 23.503906 A 1.50015 1.50015 0 0 0 31.541016 20.984375 z"></path>
  </svg>`;
const weekicon = `<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="50" height="50" viewBox="0 0 48 48">
  <path d="M 12.5 6 C 8.9280619 6 6 8.9280619 6 12.5 L 6 35.5 C 6 39.071938 8.9280619 42 12.5 42 L 35.5 42 C 39.071938 42 42 39.071938 42 35.5 L 42 12.5 C 42 8.9280619 39.071938 6 35.5 6 L 12.5 6 z M 12.5 9 L 35.5 9 C 37.450062 9 39 10.549938 39 12.5 L 39 14 L 9 14 L 9 12.5 C 9 10.549938 10.549938 9 12.5 9 z M 9 17 L 39 17 L 39 35.5 C 39 37.450062 37.450062 39 35.5 39 L 12.5 39 C 10.549938 39 9 37.450062 9 35.5 L 9 17 z M 15.5 21 A 2.5 2.5 0 0 0 15.5 26 A 2.5 2.5 0 0 0 15.5 21 z M 24 21 A 2.5 2.5 0 0 0 24 26 A 2.5 2.5 0 0 0 24 21 z M 32.5 21 A 2.5 2.5 0 0 0 32.5 26 A 2.5 2.5 0 0 0 32.5 21 z M 15.5 30 A 2.5 2.5 0 0 0 15.5 35 A 2.5 2.5 0 0 0 15.5 30 z M 24 30 A 2.5 2.5 0 0 0 24 35 A 2.5 2.5 0 0 0 24 30 z"></path>
  </svg>`

//外部导航
const dateselectopen = document.querySelector('#datetop-panel .date-nav p');
const selecttoday = document.querySelector('#datetop-panel .datepanel .icon');
const selectrandom = document.querySelector('#datetop-panel .random');
const arrowdayLeft = document.querySelector('#datetop-panel .arrow-left');
const arrowdayRight = document.querySelector('#datetop-panel .arrow-right');

//内部面板
const dateselectclose = document.querySelector('.datebox .date-nav p');
const selectweek = document.querySelector('.datebox .datepanel .icon');
const datebox = document.querySelector('.datebox');
const arrowweekLeft = document.querySelector('.datebox .arrow-left');
const arrowweekRight = document.querySelector('.datebox .arrow-right');
const articlebox = document.querySelector('.articlebox');

//标注内容展示
const data = document.querySelector('.data');
const detailControl = document.querySelector('.detail_control');
const contextNode = document.querySelector('.showboth');
const onlyContext = document.querySelector('.onlycontext');
const onlyNote = document.querySelector('.onlynote');
const numbers = document.querySelectorAll('.data .number');

//卡片插入元素
const cardBox = document.getElementById('content');
console.log('cardBox',cardBox);
const notice = document.getElementById('notice');
defaultSelect = 'select date';

elementShowSwitch([notice], 'none');
elementShowSwitch([arrowdayLeft,arrowdayRight], 'hidden');

//日期选择面板模块
function updateWeek() {
  fetchUrlAnno().then(urllist => {
    const urls = sortUrlList(urllist)[0][dateoneweek[0]];
    updateOneWeekWeb(urls);
  });
}

function updateDay() {
  fetchUrlAnno().then(urllist => {
    const urls = sortUrlList(urllist, 'day')[0][dateoneday];
    updateOneDayAnno(urls,dateoneday);
  });
}

//日期状态改变
function changeDate(datetype, aimdate) {
  if (datetype == 'week') {
    const thisweek = aimdate['numbertype'];
    dateoneweek = aimdate['stamptype'];
    dateselectclose.innerText = `${thisweek[0]} ~ ${thisweek[1]}`
    if (dateoneweek[0] == thisWeekTimeSpan(Date.now())['stamptype'][0]) {
      selectweek.innerHTML = todayicon;
    } else {
      selectweek.innerHTML = weekicon;
    }
    updateWeek();
  }
  
  //改变日 changeDate('day', daytimestamp)
  if (datetype == 'day') {
    dateoneday = aimdate;
    const aimnum = getTodayDate(aimdate);
    dateselectopen.innerText = aimnum;
    if (aimnum == getTodayDate(Date.now())) {
      selecttoday.innerHTML = todayicon;
    } else {
      selecttoday.innerHTML = weekicon;
    }
    elementShowSwitch([arrowdayLeft,arrowdayRight], 'no-hidden');
  }
  //点击文章后清除日期
  if (datetype == 'no-day') {
    dateoneday = '';
    selecttoday.innerHTML = weekicon;
    dateselectopen.innerText = defaultSelect;
    elementShowSwitch([arrowdayLeft,arrowdayRight], 'hidden');
  }
}

//初始参数
datebox.style.display = 'none';
//主页日历图标
selecttoday.addEventListener('click', ()=> {
  changeDate('day', getDayTimeBound(Date.now())[0]);
  updateDay();
})
//随机选择，除去当日
selectrandom.addEventListener('click', ()=> {
  fetchUrlAnno().then(urllist => {
    const sortdict = sortUrlList(urllist, 'day');
    const urlslist = sortdict[1];
    let randomdate;
    let aimdate;
    if (urlslist.length > 1 ) {
      randomdate = getRandomInt(1,urlslist.length);
      aimdate = urlslist[randomdate - 1];
    } else if (urlslist.length == 1 ) {
      aimdate = urlslist[0];
    }
    if (aimdate) {
      const urls = sortdict[0][aimdate];
      updateOneDayAnno(urls,aimdate);
      changeDate('day', aimdate);
    }
  });

})
//面板日历图标
selectweek.addEventListener('click', ()=> {
  const thisweekdata = thisWeekTimeSpan(Date.now());
  changeDate('week',thisweekdata);
})
//打开面板
dateselectopen.addEventListener('click', ()=> {
  datebox.removeAttribute('style');
  if (!dateoneday && !dateoneweek) {
    selectweek.innerHTML = todayicon;
    const thisweekdata = thisWeekTimeSpan(Date.now());
    changeDate('week',thisweekdata)
  } else if (dateoneday) { 
    const thisweekdata = thisWeekTimeSpan(dateoneday);
    changeDate('week',thisweekdata);
  }
})
//关闭面板
dateselectclose.addEventListener('click', ()=> {
  datebox.style.display = 'none';
})

//箭头事件
function arrowDayChangeEvent(arrow, direction) {
  arrow.addEventListener('click', ()=> {
    fetchUrlAnno().then(urllist => {
      const urlsort = sortUrlList(urllist, 'day');
      const urldict = urlsort[0];
      const startlist = urlsort[1];
      const startmin = startlist[0];
      const startmax = startlist[startlist.length - 1];
      let targeturllist;
      let newdate;
      if (dateoneday && direction == 'left') {
        if (dateoneday > startmin) {
          const nextmin = findMaxInMinList(dateoneday,startlist);
          targeturllist = urldict[nextmin];
          newdate = nextmin;
        }
      }
      if (dateoneday && direction == 'right') {
        if (dateoneday < startmax) {
          const nextmax = findMinInMaxList(dateoneday,startlist);
          targeturllist = urldict[nextmax];
          newdate = nextmax;
        }
      }
      if (newdate) {
        changeDate('day', newdate);
        updateOneDayAnno(targeturllist,newdate);
      }
    })
  })
}

function arrowWeekChangeEvent(arrow, direction) {
  arrow.addEventListener('click', ()=> {
    //获取所有web数据
    fetchUrlAnno().then(urllist => {
      const urlsort = sortUrlList(urllist);
      const urldict = urlsort[0];
      const startlist = urlsort[1];
      const startmin = startlist[0];
      const startmax = startlist[startlist.length - 1];
      if (direction == 'left') {
        if (dateoneweek[0] > startmin) {
          const nextmin = findMaxInMinList(dateoneweek[0],startlist);
          dateoneweek = [nextmin , nextmin + 24 * 60 * 60 * 1000 * 6];
          const targeturllist = urldict[nextmin];
          updateOneWeekWeb(targeturllist);
        }
        
      }
      if (direction == 'right') {
        if (dateoneweek[0] < startmax) {
          const nextmax = findMinInMaxList(dateoneweek[0],startlist);
          dateoneweek = [nextmax , nextmax + 24 * 60 * 60 * 1000 * 6];
          const targeturllist = urldict[nextmax];
          updateOneWeekWeb(targeturllist);
        }
      }
      dateselectclose.innerText = `${getTodayDate(dateoneweek[0])} ~ ${getTodayDate(dateoneweek[1])}`;
      const todaystamp = Date.now();
      if (todaystamp >= dateoneweek[0] && todaystamp <= dateoneweek[1]) {
        selectweek.innerHTML = todayicon;
      } else {
        selectweek.innerHTML = weekicon;
      }

    });
  })
}

arrowDayChangeEvent(arrowdayLeft,'left');
arrowDayChangeEvent(arrowdayRight,'right');
arrowWeekChangeEvent(arrowweekLeft,'left');
arrowWeekChangeEvent(arrowweekRight,'right');

//主页一天内所有anno数据显示-接收日期范围内的 urlobject组成的list
function updateOneDayAnno(targeturllist) {
  const urllist = [];
  if (targeturllist) {
    targeturllist.forEach(urlinfo => {
      urllist.push(urlinfo.url);
    })
    urlList2annoList(urllist);
  } else {
    alertNotice('open', '今日暂无标注哦！');
  }
}

//面板一周内所有web数据显示-接收日期范围内的 urlobject组成的list
function updateOneWeekWeb(targeturllist) {
  articlebox.innerHTML = '';
  //整理数据，按日期分类
  const datebook = {};
  let datesort = [];
  targeturllist.forEach(targeturl => {
    //当日start
    const targetdate = getDayTimeBound(targeturl.date)[0];
    if (!datesort.includes(targetdate)) {
      datesort.push(targetdate);
    }
    if (!datebook[targetdate]) {
      datebook[targetdate] = {};
    }
    datebook[targetdate][targeturl.date] = {
      url:targeturl.url,
      title:targeturl.title,
    };
  })
  datesort.sort((a, b) => b - a);
  
  //组件生成
  datesort.forEach(dateindex => {
    const datenumber = getTodayDate(dateindex);
    const datecon = elementCreator('div',['date-container']);
    const datetitle = elementCreator('div',['datetitle', 'center']);
    datetitle.innerHTML = `<div class='title-date' id=${datenumber}>${datenumber}</div>`;
    elementAppender(datecon,[datetitle]);
    articlebox.appendChild(datecon);
    
    const urlobj = datebook[dateindex];
    //获取该日期下的url列表
    const onedayUrls = [];
    Object.keys(urlobj).forEach((urlkey) => {
      onedayUrls.push(urlobj[urlkey]['url']);
    })
    
    datetitle.querySelector('.title-date').addEventListener('click', ()=> {
      changeDate('day', dateindex);
      urlList2annoList(onedayUrls);
      datebox.style.display = 'none';
    })

    Object.keys(urlobj).forEach((urlkey) => {
        const webcard = webcardCreator(urlobj[urlkey]);
        elementAppender(datecon,[webcard]);
      })
    })
    
  }

  //url列表转化为anno合并列表，并更新主页内容
  function urlList2annoList(onedayUrls) {
    const annolist2Promises = onedayUrls.map(oneURL => getOneInfo('url', oneURL));

    Promise.all(annolist2Promises)
      .then(urlannoLists => {
        const annolist2 = urlannoLists.flat();
        showOneDayAllSidepanel(annolist2, 'close');
      })
      .catch(error => {
        console.error('加载过程中出现错误:', error);
      });
  }

  //web卡片制作
  function webcardCreator(urlinfo) {
  const webcard = elementCreator('div',['web-container','flex-row']);
  const coverImg = elementCreator('div',['read-cover']);
  const coverelement = elementCreator('img',['img-cover']);
  const rightInfo = elementCreator('div',['flex-column','rightinfo']);
  const titleCom = elementCreator('a',['titleCom']);
  const bottomInfo = elementCreator('div',['flex-row','space-between']);
  const annoCom = elementCreator('div',['annoCom','flex-row']);
  const toolCom = elementCreator('div',['read-btn','icon', 'flex-row']);
  
  elementAppender(webcard,[coverImg,rightInfo]);
  elementAppender(coverImg,[coverelement]);
  elementAppender(rightInfo,[titleCom,bottomInfo]);
  elementAppender(bottomInfo,[annoCom,toolCom]);
  //导入信息
  titleCom.href = urlinfo.url;
  titleCom.target = '_blank';
  titleCom.innerText = urlinfo.title;
  
  const imgplace = `https://cdn.jsdelivr.net/gh/1818180/ayama_photo/img/202412311506598.jpg`;
  contentDBProceer(objweb,'getsome',urlinfo.url).then(webinfo => {
    if (webinfo) {
      coverelement.src = webinfo['img'] ? webinfo['img'] : imgplace;
    } 
  });
  //数据库返回标注信息
  getOneInfo('url', urlinfo.url).then(urlannolist => {

    const colorinfo = annolist2number(urlannolist);
    const numberlist = colorinfo[0];
    const totalnumber = colorinfo[1];
    const colors = ['yellow','blue','green','red','purple'];
    let colorindex = 0;
    numberlist.forEach(number => {
      if (number > 0) { 
        const colorText = elementCreator('div',['colornumber','flex']);
        colorText.style.flex = number;
        colorText.style.backgroundColor = `var(--${colors[colorindex]}-medium)`
        elementAppender(annoCom,[colorText]);
      }
      colorindex += 1;
    })
    toolCom.innerHTML = `
      <p>${totalnumber}</p>
      <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="50" height="50" viewBox="0 0 48 48">
      <path d="M 26.484375 8.984375 A 1.50015 1.50015 0 0 0 25.439453 11.560547 L 36.878906 23 L 7.5 23 A 1.50015 1.50015 0 1 0 7.5 26 L 36.878906 26 L 25.439453 37.439453 A 1.50015 1.50015 0 1 0 27.560547 39.560547 L 41.560547 25.560547 A 1.50015 1.50015 0 0 0 41.560547 23.439453 L 27.560547 9.4394531 A 1.50015 1.50015 0 0 0 26.484375 8.984375 z"></path>
      </svg>`;
    toolCom.addEventListener('click', () => {
      showOneDayAllSidepanel(urlannolist);
      changeDate('no-day');
      datebox.style.display = 'none';
    })
  })
  return webcard
}

//主页功能
const title = document.querySelector('.title');

//按钮样式切换
function switchMode(mode) {
  if (mode == 0) {
    contextNode.style.border = 'black 3px solid';
    onlyContext.removeAttribute('style');
    onlyNote.removeAttribute('style');
  } else if (mode == 1) {
    contextNode.removeAttribute('style');
    onlyContext.style.border = 'black 3px solid';
    onlyNote.removeAttribute('style');
  } else if (mode == 2) {
    contextNode.removeAttribute('style');
    onlyContext.removeAttribute('style');
    onlyNote.style.border = 'black 3px solid';
  } else if (mode == 3) {
    let index = 0;
    numbers.forEach(number => {
      if (index === 0) {
        number.style.border = 'black 3px solid';
      } else {
        number.style.border = 'none';
      }
      index += 1;
    })
  }
}
contextNode.style.border = 'black 3px solid';
//显示模式切换[context,annolister]
function showmodeControl(mode) {
  const contexts = document.querySelectorAll('.context');
  const annolisters = document.querySelectorAll('.annolister');
  if (mode === '.context') {
    annolisters.forEach(annolister => {
      annolister.style.display = 'none';
    })
    moveAtribute(contexts, 'style');
    onlyNote.removeAttribute('style');
    onlyNote.removeAttribute('style');
  } else if (mode === '.annolister') {
    contexts.forEach(context => {
      context.style.display = 'none';
    })
    moveAtribute(annolisters, 'style');
  } else {
    moveAtribute(contexts, 'style');
    moveAtribute(annolisters, 'style');
  }
}

contextNode.addEventListener('click', ()=> {
  showmodeControl('');
  switchMode(0);
})

onlyContext.addEventListener('click', ()=> {
  showmodeControl('.context');
  switchMode(1);
})

onlyNote.addEventListener('click', ()=> {
  showmodeControl('.annolister');
  switchMode(2);
})
//显示所有内容
function showALL() {
  const cardContainers = document.querySelectorAll('.cardContainer');
  const allAnnoList = document.querySelectorAll('.anno_container');
  allAnnoList.forEach(anno => {
    anno.removeAttribute('style');
  })
  cardContainers.forEach(cardContainer => {
    cardContainer.removeAttribute('style');
    const spans = cardContainer.querySelectorAll('span');
    spans.forEach(span => {
      span.removeAttribute('style');
    })
  })
}
//显示单一颜色标注内容
function hideAnnoContainer(color) {
  const cardContainers = document.querySelectorAll('.cardContainer');
  const allAnnoList = document.querySelectorAll('.anno_container');

  cardContainers.forEach(cardContainer => {
    //隐藏摘录span
    const spans = cardContainer.querySelectorAll('span');
    const spanColors = [];
    spans.forEach(span => {
      spanColors.push(span.classList[0]);
      if (!span.classList.contains(color)) {
        span.style.backgroundColor = 'transparent';
        span.style.boxShadow = 'none';
        span.style.border = 'none';
      } else {
        span.removeAttribute('style');
      }
    })
    //语境摘录隐藏
    if (!spanColors.includes(color)) {
      cardContainer.style.display = 'none';
    } else {
      cardContainer.removeAttribute('style');
    }
  })
  
  //标注内容隐藏
  allAnnoList.forEach(anno => {
    //隐藏标注
    if (!anno.classList.contains(`${color}_switch`)) {
      anno.style.display = 'none';
    } else {
      anno.style.display = '';
    }
  })
}

//汇总标注数量+数字按钮点击事件
function addNumber(annolist) {
  const sortcolor = annolist2number(annolist);
  const numberlist = sortcolor[0];
  const totalnumber = sortcolor[1];
  const allText = document.querySelector('.data .alldata p');
  const yellowText = document.querySelector('.data .yellow p');
  const blueText = document.querySelector('.data .blue p');
  const greenText = document.querySelector('.data .green p');
  const redText = document.querySelector('.data .red p');
  const purpleText = document.querySelector('.data .purple p');

  allText.innerText = totalnumber;
  allText.parentElement.style.border = 'black 3px solid';
  
  //添加数字，和选择事件
  const colorButtons = [yellowText,blueText,greenText,redText,purpleText];
  const colors = ['yellow', 'blue', 'green', 'red', 'purple'];
  allText.parentElement.addEventListener('click', ()=> {
    allText.parentElement.style.border = 'black 3px solid';
    colorButtons.forEach(button => {
      button.parentElement.style.border = 'none';
    })
    showALL();
  })
  
  let numberIndex = 0;
  colorButtons.forEach(button => {
    const color = colors[numberIndex];
    const number = numberlist[numberIndex];
    if (number > 0) {
      button.parentElement.style.display = 'flex';
      button.innerText = number;
      //标注按钮事件
      button.parentElement.addEventListener('click',()=> {
        button.parentElement.style.border = 'black 3px solid';
        if (button.parentElement.style.border !== 'black 3px solid' || !button.parentElement.style.border) {
          //清除其他按钮的边框样式
          colorButtons.forEach(btn => {
            allText.parentElement.style.border = 'none';
            if (btn !== button) {
              btn.parentElement.style.border = 'none';
            }
          })
        }
        hideAnnoContainer(color);
      })
    } else {
      button.parentElement.style.display = 'none';
    }
    numberIndex += 1;
  })
}

//制作卡片
// 1.查看列表的事件是不是从早到晚
// 2.foreach列表，先出现的context创建一个卡片

function contextCard(annolist, titleControl) {
  //获取title
  if (!titleControl) {
    const annotitle = annolist[0].title;
    title.innerHTML = annotitle;
  }
  //清除之前数据
  const oldcontextcontainer = document.getElementById('content');
  oldcontextcontainer.innerHTML = '';
  data.removeAttribute('style');
  //得到语境列表
  const contextdict = {};
  annolist.forEach(annoitem => {
    const context = annoitem.context;
    if (!contextdict[context]) {
      contextdict[context] = [annoitem];
    } else {
      contextdict[context].push(annoitem);
    }
  });
  //循环语境列表创建卡片
  if (contextdict) {
    Object.entries(contextdict).forEach(([context, annolist]) => {
      const bundle = cardContainer(context);
      const annolister = bundle[1];
      const contextText = bundle[0];
      resetAnno(contextText, annolist);
      //创建标注列表
      annolist.forEach(anno => {
        const annoContainer = elementCreator('div', ['anno_container', `${anno.color}_switch`]);
        const annoText = elementCreator('p', ['anno_text']);
        annoText.textContent = anno.annotation;
        if (anno.note) {
          const annoNote = elementCreator('p', ['anno_note']);
          annoNote.textContent = anno.note;
          elementAppender(annoContainer,[annoText,annoNote]);
        } else {
          elementAppender(annoContainer,[annoText]);
        }
        elementAppender(annolister,[annoContainer]);
      })
    })
  }
  data.scrollTo({
    top: 0,
    behavior: 'smooth' 
  });
}

function resetAnno(contextText, annolist) {
  annolist.forEach(anno => {
    if (anno.index) {
      const index = anno.index;
      const textNodes = [];
      function collectTextNodes(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          textNodes.push(node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          node.childNodes.forEach(collectTextNodes); // 递归遍历子节点
        }
      }
      collectTextNodes(contextText);
      let nodeindex;
      let currentIndex = 0;
      let checkanno = false;
      for (const textNode of textNodes) {
        const textLength = textNode.textContent.length;
        if (currentIndex + textLength > index && !checkanno) {
          nodeindex = index - currentIndex;
          const range = document.createRange();
          const span = document.createElement('span');
          range.setStart(textNode,nodeindex);
          range.setEnd(textNode,nodeindex + anno.annotation.length);
          range.surroundContents(span); 
          span.classList.add(anno.color);
          checkanno = true;
        }
        currentIndex += textLength;
      }
    } else {
      let textContent = contextText.innerHTML;
      const regex = new RegExp(`(${anno.annotation})`, 'gi');
      textContent = textContent.replace(regex, (match) => {
          return `<span class="${anno.color}"">${match}</span>`;
      });
      contextText.innerHTML = textContent;
    }
  });
}

//卡片创建
function cardContainer(contexttext) {
  const cardContainer = elementCreator('div', ['cardContainer']);
  elementAppender(cardBox,[cardContainer]);
  //内部组件
  const context = elementCreator('div', ['context']);
  const contextText = elementCreator('p', ['context_text']);
  const annolister = elementCreator('div', ['annolister']);
  contextText.textContent = contexttext;
  elementAppender(context,[contextText]);
  elementAppender(cardContainer,[context,annolister]);

  return [contextText,annolister]
}


//刷新函数
//展示某天内所有文章内的标注
function resetMainpage(annoURL) {
  alertNotice('close');
  switchMode(3);
  switchMode(0);
  addNumber(annoURL);
  title.innerHTML = '';
}

//接受所有的anno列表
function showOneDayAllSidepanel(annoURL, titleClose) {
  resetMainpage(annoURL);
  contextCard(annoURL, titleClose);
}

function alertNotice(switcher, noticeText) {
  if (switcher == 'open') {
    title.innerHTML = '';
    notice.style.display = '';
    notice.innerHTML = noticeText;
    data.style.display = 'none';
    detailControl.style.display = 'none';
    cardBox.style.display = 'none';
  } else if (switcher == 'close') {
    notice.style.display = 'none';
    data.style.display = '';
    detailControl.style.display = '';
    cardBox.style.display = '';
  }
}

//展示当前页的标注
function refreshSidepanel() {
  //获取当前tab url
  async function getCurrentTab() {
      let queryOptions = { active: true, lastFocusedWindow: true };
      // `tab` will either be a `tabs.Tab` instance or `undefined`.
      let [tab] = await chrome.tabs.query(queryOptions);
      return tab;
  }
  
  (async () => {
    const currentTab = await getCurrentTab();
    if (currentTab.url) {
      //判断tab有无标注,返回标注列表
      const annoURL = await getOneInfo('url', currentTab.url);
      if (annoURL) {
        addNumber(annoURL);
        if (annoURL.length > 0) {
          showOneDayAllSidepanel(annoURL);
        } else {
          alertNotice('open', '该页面暂无标注哦！');
        }
      }
    }
  })();
}
refreshSidepanel();

//刷新按钮事件-刷新当前激活界面的标注
const refreshBtn = document.querySelector('.refresh');
refreshBtn.addEventListener('click', ()=> {
  const cards = document.querySelectorAll('.cardContainer');
  cards.forEach(card => {
    card.remove();
  })
  refreshSidepanel();
  changeDate('no-day');
})