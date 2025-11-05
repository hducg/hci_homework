// 全局变量
let drawing = false;
let currentColor = "#000000";
let brushSize = 2;
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let viewHistory = []; // 用于跟踪视图历史

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // 初始化时间和画布
    const now = new Date();
    const local = now.toISOString().slice(0,16);
    document.getElementById("time").value = local;
    
    initCanvas();
    loadDiaryList();
    setupEventListeners();
    renderCalendar();
    
    // 默认显示日记编辑表单
    showView('diaryForm');
}

// 设置事件监听器
function setupEventListeners() {
    // 按钮事件
    document.getElementById('saveBtn').addEventListener('click', saveDiary);
    document.getElementById('newBtn').addEventListener('click', newDiary);
    document.getElementById('toggleListBtn').addEventListener('click', toggleDiaryList);
    document.getElementById('calendarBtn').addEventListener('click', toggleCalendarView);
    document.getElementById('clearCanvasBtn').addEventListener('click', clearCanvas);
    document.getElementById('insertDoodleBtn').addEventListener('click', insertDoodle);
    
    // 日历导航事件
    document.getElementById('prevMonthBtn').addEventListener('click', prevMonth);
    document.getElementById('nextMonthBtn').addEventListener('click', nextMonth);
    
    // 返回按钮事件
    document.getElementById('backFromDayListBtn').addEventListener('click', goBack);
    document.getElementById('backFromReadViewBtn').addEventListener('click', goBack);
    
    // 表情按钮事件
    document.querySelectorAll('.emoji').forEach(emoji => {
        emoji.addEventListener('click', function() {
            insertEmoji(this.getAttribute('data-emoji'));
        });
    });
    
    // 文件输入事件
    document.getElementById('imageInput').addEventListener('change', insertImage);
    document.getElementById('audioInput').addEventListener('change', insertAudio);
    
    // 搜索功能
    document.getElementById('searchInput').addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const diaryItems = document.querySelectorAll(".diary-item");
        
        diaryItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                item.style.display = "block";
                // 添加搜索高亮效果
                setTimeout(() => {
                    item.style.transform = "scale(1.02)";
                    setTimeout(() => {
                        item.style.transform = "scale(1)";
                    }, 300);
                }, 100);
            } else {
                item.style.display = "none";
            }
        });
    });
}

// 显示特定视图
function showView(viewName) {
    // 隐藏所有视图
    document.getElementById('calendarView').style.display = 'none';
    document.getElementById('diaryList').style.display = 'none';
    document.getElementById('dayDiaryList').style.display = 'none';
    document.getElementById('diaryForm').style.display = 'none';
    document.getElementById('diaryReadView').style.display = 'none';
    
    // 显示指定视图
    if (viewName === 'calendarView') {
        document.getElementById('calendarView').style.display = 'grid';
    } else if (viewName === 'diaryList') {
        document.getElementById('diaryList').style.display = 'block';
    } else if (viewName === 'dayDiaryList') {
        document.getElementById('dayDiaryList').style.display = 'block';
    } else if (viewName === 'diaryForm') {
        document.getElementById('diaryForm').style.display = 'grid';
    } else if (viewName === 'diaryReadView') {
        document.getElementById('diaryReadView').style.display = 'block';
    }
    
    // 记录视图历史
    viewHistory.push(viewName);
}

// 返回上一视图
function goBack() {
    if (viewHistory.length > 1) {
        viewHistory.pop(); // 移除当前视图
        const previousView = viewHistory[viewHistory.length - 1];
        showView(previousView);
    } else {
        // 如果没有历史记录，默认返回日历视图
        showView('calendarView');
    }
}

// 显示通知
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// 日历功能
function renderCalendar() {
    const calendarDays = document.getElementById('calendarDays');
    const currentMonthYear = document.getElementById('currentMonthYear');
    
    // 更新月份标题
    const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", 
                       "七月", "八月", "九月", "十月", "十一月", "十二月"];
    currentMonthYear.textContent = `${currentYear}年${monthNames[currentMonth]}`;
    
    // 获取当月第一天和最后一天
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    // 获取当月第一天是星期几（0-6，0是星期日）
    const firstDayIndex = firstDay.getDay();
    
    // 获取上个月的最后几天
    const prevLastDay = new Date(currentYear, currentMonth, 0).getDate();
    
    // 清空日历
    calendarDays.innerHTML = '';
    
    // 添加上个月的日期
    for (let i = firstDayIndex; i > 0; i--) {
        const day = document.createElement('div');
        day.classList.add('calendar-day', 'other-month');
        day.textContent = prevLastDay - i + 1;
        calendarDays.appendChild(day);
    }
    
    // 获取有日记的日期
    const diaries = JSON.parse(localStorage.getItem("diaries")) || [];
    const diaryDates = diaries.map(diary => {
        const date = new Date(diary.time);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    });
    
    // 添加当月的日期
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const day = document.createElement('div');
        day.classList.add('calendar-day');
        day.textContent = i;
        
        // 检查是否是今天
        const today = new Date();
        if (currentYear === today.getFullYear() && 
            currentMonth === today.getMonth() && 
            i === today.getDate()) {
            day.classList.add('today');
        }
        
        // 检查是否有日记
        const dateKey = `${currentYear}-${currentMonth}-${i}`;
        if (diaryDates.includes(dateKey)) {
            day.classList.add('has-diary');
        }
        
        // 添加点击事件
        day.addEventListener('click', () => {
            selectDate(i);
        });
        
        calendarDays.appendChild(day);
    }
    
    // 计算需要添加的下个月日期数量
    const nextDays = 42 - (firstDayIndex + lastDay.getDate());
    
    // 添加下个月的日期
    for (let i = 1; i <= nextDays; i++) {
        const day = document.createElement('div');
        day.classList.add('calendar-day', 'other-month');
        day.textContent = i;
        calendarDays.appendChild(day);
    }
}

function prevMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}

function selectDate(day) {
    const selectedDate = new Date(currentYear, currentMonth, day);
    
    // 查找当天的所有日记
    const diaries = JSON.parse(localStorage.getItem("diaries")) || [];
    const dayDiaries = diaries.filter(d => {
        const diaryDate = new Date(d.time);
        return diaryDate.getFullYear() === currentYear && 
               diaryDate.getMonth() === currentMonth && 
               diaryDate.getDate() === day;
    });
    
    if (dayDiaries.length === 0) {
        // 没有日记，创建新日记
        const dateString = selectedDate.toISOString().slice(0,16);
        document.getElementById("time").value = dateString;
        document.getElementById("weather").selectedIndex = 0;
        document.getElementById("mood").selectedIndex = 0;
        document.getElementById("location").value = "";
        document.getElementById("diary-content").innerHTML = "";
        clearCanvas();
        
        showView('diaryForm');
        showNotification(`已创建 ${selectedDate.toLocaleDateString()} 的日记`);
    } else if (dayDiaries.length === 1) {
        // 只有一篇日记，直接显示
        showDiaryReadOnly(dayDiaries[0].id);
    } else {
        // 多篇日记，显示列表
        showDayDiaryList(selectedDate, dayDiaries);
    }
}

function showDayDiaryList(date, diaries) {
    // 设置标题
    document.getElementById('dayDiaryTitle').textContent = 
        `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日的日记`;
    
    // 清空并填充日记列表
    const dayDiaryItems = document.getElementById('dayDiaryItems');
    dayDiaryItems.innerHTML = '';
    
    // 按时间排序
    diaries.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    diaries.forEach(diary => {
        const diaryTime = new Date(diary.time);
        const timeString = diaryTime.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const diaryItem = document.createElement('div');
        diaryItem.className = 'day-diary-item';
        diaryItem.innerHTML = `
            <div class="day-diary-time">${timeString}</div>
            <div class="day-diary-preview">${stripTags(diary.content).substring(0, 100)}...</div>
        `;
        
        diaryItem.addEventListener('click', () => {
            showDiaryReadOnly(diary.id);
        });
        
        dayDiaryItems.appendChild(diaryItem);
    });
    
    showView('dayDiaryList');
}

function showDiaryReadOnly(id) {
    const diaries = JSON.parse(localStorage.getItem("diaries")) || [];
    const diary = diaries.find(d => d.id === id);
    
    if (!diary) {
        showNotification("日记未找到！", "error");
        return;
    }
    
    // 填充日记内容
    const diaryTime = new Date(diary.time);
    document.getElementById('read-time').textContent = 
        diaryTime.toLocaleString('zh-CN');
    document.getElementById('read-weather').textContent = diary.weather;
    document.getElementById('read-mood').textContent = diary.mood;
    document.getElementById('read-location').textContent = diary.location || '未设置地点';
    document.getElementById('read-content').innerHTML = diary.content;
    
    showView('diaryReadView');
}

function toggleCalendarView() {
    showView('calendarView');
    renderCalendar();
    
    // 添加切换动画
    const calendarBtn = document.getElementById('calendarBtn');
    calendarBtn.style.transform = "scale(0.95)";
    setTimeout(() => {
        calendarBtn.style.transform = "scale(1)";
    }, 150);
}

// 表情插入功能
function insertEmoji(emoji) {
    const content = document.getElementById("diary-content");
    const selection = window.getSelection();
    
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const emojiNode = document.createTextNode(emoji);
        range.insertNode(emojiNode);
        range.setStartAfter(emojiNode);
        range.setEndAfter(emojiNode);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        content.innerHTML += emoji;
    }
    
    content.focus();
    
    // 添加插入动画
    const emojiElement = document.createElement('span');
    emojiElement.textContent = emoji;
    emojiElement.style.display = 'inline-block';
    emojiElement.style.animation = 'bounceIn 0.5s';
    content.appendChild(emojiElement);
}

// 图片插入功能
function insertImage() {
    const input = document.getElementById("imageInput");
    const file = input.files[0];
    
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = document.getElementById("diary-content");
        const img = document.createElement("img");
        img.src = e.target.result;
        img.className = "preview-img";
        img.style.maxWidth = "100%";
        img.style.opacity = "0";
        img.style.transform = "scale(0.8)";
        
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(img);
            // 插入换行
            range.insertNode(document.createElement("br"));
        } else {
            content.appendChild(img);
            content.appendChild(document.createElement("br"));
        }
        
        // 添加图片加载动画
        setTimeout(() => {
            img.style.transition = "all 0.5s ease";
            img.style.opacity = "1";
            img.style.transform = "scale(1)";
        }, 10);
        
        content.focus();
    };
    reader.readAsDataURL(file);
    input.value = ""; // 重置文件输入
}

// 音频插入功能
function insertAudio() {
    const input = document.getElementById("audioInput");
    const file = input.files[0];
    
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = document.getElementById("diary-content");
        const audio = document.createElement("audio");
        audio.controls = true;
        audio.className = "preview-audio";
        audio.style.opacity = "0";
        audio.style.transform = "translateY(10px)";
        
        const source = document.createElement("source");
        source.src = e.target.result;
        source.type = file.type;
        audio.appendChild(source);
        
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(audio);
            // 插入换行
            range.insertNode(document.createElement("br"));
        } else {
            content.appendChild(audio);
            content.appendChild(document.createElement("br"));
        }
        
        // 添加音频加载动画
        setTimeout(() => {
            audio.style.transition = "all 0.5s ease";
            audio.style.opacity = "1";
            audio.style.transform = "translateY(0)";
        }, 10);
        
        content.focus();
    };
    reader.readAsDataURL(file);
    input.value = ""; // 重置文件输入
}

// 涂鸦功能
function initCanvas() {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    
    // 设置画布事件监听
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseout", stopDrawing);
    canvas.addEventListener("mousemove", draw);
    
    // 设置触摸事件支持
    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchend", stopDrawing);
    canvas.addEventListener("touchcancel", stopDrawing);
    canvas.addEventListener("touchmove", handleTouchMove);
    
    // 颜色选择器
    document.querySelectorAll(".color-option").forEach(option => {
        option.addEventListener("click", function() {
            document.querySelector(".color-option.active").classList.remove("active");
            this.classList.add("active");
            currentColor = this.getAttribute("data-color");
            
            // 添加颜色选择动画
            this.style.transform = "scale(1.2)";
            setTimeout(() => {
                this.style.transform = "scale(1.1)";
            }, 150);
        });
    });
    
    // 笔刷大小
    const brushSizeInput = document.getElementById("brushSize");
    const brushSizeValue = document.getElementById("brushSizeValue");
    
    brushSizeInput.addEventListener("input", function() {
        brushSize = parseInt(this.value);
        brushSizeValue.textContent = brushSize + "px";
        
        // 添加笔刷大小变化动画
        brushSizeValue.style.transform = "scale(1.2)";
        setTimeout(() => {
            brushSizeValue.style.transform = "scale(1)";
        }, 150);
    });
}

function startDrawing(e) {
    drawing = true;
    draw(e);
}

function stopDrawing() {
    drawing = false;
    const ctx = document.getElementById("canvas").getContext("2d");
    ctx.beginPath();
}

function draw(e) {
    if (!drawing) return;
    
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    
    let x, y;
    if (e.type.includes("touch")) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
    } else {
        x = e.offsetX;
        y = e.offsetY;
    }
    
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.strokeStyle = currentColor;
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function handleTouchStart(e) {
    e.preventDefault();
    startDrawing(e);
}

function handleTouchMove(e) {
    e.preventDefault();
    draw(e);
}

function clearCanvas() {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    
    // 添加清空画布动画
    canvas.style.opacity = "0.5";
    setTimeout(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.opacity = "1";
    }, 300);
}

function insertDoodle() {
    const content = document.getElementById("diary-content");
    const canvas = document.getElementById("canvas");
    const dataURL = canvas.toDataURL();
    
    const img = document.createElement("img");
    img.src = dataURL;
    img.className = "preview-img";
    img.style.maxWidth = "100%";
    img.style.opacity = "0";
    img.style.transform = "scale(0.8)";
    
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(img);
        // 插入换行
        range.insertNode(document.createElement("br"));
    } else {
        content.appendChild(img);
        content.appendChild(document.createElement("br"));
    }
    
    // 添加涂鸦插入动画
    setTimeout(() => {
        img.style.transition = "all 0.5s ease";
        img.style.opacity = "1";
        img.style.transform = "scale(1)";
    }, 10);
    
    content.focus();
    clearCanvas(); // 插入后清空画布
}

// 日记管理功能
function saveDiary() {
    const time = document.getElementById("time").value;
    const weather = document.getElementById("weather").value;
    const mood = document.getElementById("mood").value;
    const location = document.getElementById("location").value;
    const content = document.getElementById("diary-content").innerHTML;
    
    if (!content.trim()) {
        showNotification("日记内容不能为空！", "error");
        return;
    }
    
    const diary = {
        id: Date.now().toString(),
        time: time,
        weather: weather,
        mood: mood,
        location: location,
        content: content,
        timestamp: new Date().toISOString()
    };
    
    // 从本地存储获取现有日记
    let diaries = JSON.parse(localStorage.getItem("diaries")) || [];
    
    // 检查是否已存在相同ID的日记（编辑情况）
    const existingIndex = diaries.findIndex(d => d.id === diary.id);
    if (existingIndex !== -1) {
        diaries[existingIndex] = diary;
    } else {
        diaries.push(diary);
    }
    
    // 保存到本地存储
    localStorage.setItem("diaries", JSON.stringify(diaries));
    
    showNotification("日记保存成功！");
    loadDiaryList();
    
    // 添加保存成功动画
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.style.transform = "scale(0.95)";
    setTimeout(() => {
        saveBtn.style.transform = "scale(1)";
    }, 150);
}

function newDiary() {
    document.getElementById("time").value = new Date().toISOString().slice(0,16);
    document.getElementById("weather").selectedIndex = 0;
    document.getElementById("mood").selectedIndex = 0;
    document.getElementById("location").value = "";
    document.getElementById("diary-content").innerHTML = "";
    clearCanvas();
    
    showView('diaryForm');
    showNotification("已创建新日记");
}

function loadDiaryList() {
    const diaryList = document.getElementById("diaryList");
    const diaries = JSON.parse(localStorage.getItem("diaries")) || [];
    
    if (diaries.length === 0) {
        diaryList.innerHTML = "<p>暂无日记记录</p>";
        return;
    }
    
    // 按时间倒序排列
    diaries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    diaryList.innerHTML = diaries.map(diary => `
        <div class="diary-item" onclick="loadDiary('${diary.id}')">
            <h3>${new Date(diary.time).toLocaleString()}</h3>
            <div class="diary-meta">
                <span>${diary.weather}</span>
                <span>${diary.mood}</span>
                <span>${diary.location || '未设置地点'}</span>
            </div>
            <div class="diary-preview">${stripTags(diary.content).substring(0, 100)}...</div>
        </div>
    `).join("");
}

function loadDiary(id) {
    const diaries = JSON.parse(localStorage.getItem("diaries")) || [];
    const diary = diaries.find(d => d.id === id);
    
    if (!diary) {
        showNotification("日记未找到！", "error");
        return;
    }
    
    document.getElementById("time").value = diary.time;
    document.getElementById("weather").value = diary.weather;
    document.getElementById("mood").value = diary.mood;
    document.getElementById("location").value = diary.location || "";
    document.getElementById("diary-content").innerHTML = diary.content;
    
    showView('diaryForm');
    showNotification("日记加载成功");
}

function toggleDiaryList() {
    if (document.getElementById("diaryList").style.display === "block") {
        showView('diaryForm');
    } else {
        showView('diaryList');
        loadDiaryList();
    }
    
    // 添加切换动画
    const toggleBtn = document.getElementById('toggleListBtn');
    toggleBtn.style.transform = "scale(0.95)";
    setTimeout(() => {
        toggleBtn.style.transform = "scale(1)";
    }, 150);
}

function stripTags(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes bounceIn {
        0% { transform: scale(0.3); opacity: 0; }
        50% { transform: scale(1.05); }
        70% { transform: scale(0.9); }
        100% { transform: scale(1); opacity: 1; }
    }
`;
document.head.appendChild(style);