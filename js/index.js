var STEP= 20;
var ROW_COUNT = 18;
var COL_COUNT = 10;
// 十六宫格的位置
var currentX = 0,
    currentY = 0;
var currentModel = {}
// 存储固定在底部坐标
var fixedBlocks = []
// 定时器
var timer = null;
var MODELS = [
  // 第一个样式(L)
  {
    0: {
      row: 2,
      col: 0
    },
    1: {
      row: 2,
      col: 1
    },
    2: {
      row: 2,
      col: 2
    },
    3: {
      row: 1,
      col: 2
    },
  },
  // 第二个样式(凸)
  {
    0: {
      row: 1,
      col: 1
    },
    1: {
      row: 0,
      col: 0
    },
    2: {
      row: 1,
      col: 0
    },
    3: {
      row: 2,
      col: 0
    },
  },
  //  第三个样式(田)
  {
    0: {
      row: 1,
      col: 1
    },
    1: {
      row: 2,
      col: 1
    },
    2: {
      row: 1,
      col: 2
    },
    3: {
      row: 2,
      col: 2
    },
  },
  // 第四个样式(一)
  {
    0: {
      row: 0,
      col: 0
    },
    1: {
      row: 0,
      col: 1
    },
    2: {
      row: 0,
      col: 2
    },
    3: {
      row: 0,
      col: 3
    },
  },
  // 第五个样式(Z)
  {
    0: {
      row: 1,
      col: 1
    },
    1: {
      row: 1,
      col: 2
    },
    2: {
      row: 2,
      col: 2
    },
    3: {
      row: 2,
      col: 3
    },
  }
]

// 根据模型的数据创建对应的块元素  createModel
function createModel() {
  // 在创建新模型之前，判断游戏是否已经结束了
  if (isGameOver()) {
    // 如果游戏已经结束了，那么就不需要再自动降落模型了
    gameOver();
    return;
  }
  var container = document.querySelector("#container")
  currentModel = MODELS[_.random(0, MODELS.length - 1)];
  for (var k in currentModel) {
    var diveles = document.createElement("div")
    diveles.classList.add('activity_model')
    container.appendChild(diveles)
  }
  currentX = 0
  currentY = 0
  locationBlocks()
  // 自动降落
  autoDown();
}
createModel()
// 根据坐标移动创建出来的div  locationBlocks
function locationBlocks() {
  // 检查是否在盒子范围内
  checkBound()
  var diveles = document.getElementsByClassName("activity_model")
  for(var i=0; i<diveles.length; i++) {
    var blockModel = currentModel[i]
    diveles[i].style.left = (currentX + blockModel.col) * STEP + "px"
    diveles[i].style.top = (currentY + blockModel.row) * STEP + "px"
  }
}


// 移动 move
function move(x, y) {
  if (isMeet(currentX + x, currentY + y, currentModel)) {
    // 底部碰撞则固定且有颜色改变
    if (y !== 0) {
      fixedBottomModel();
    }
    return;
  }
  currentX += x
  currentY += y
  locationBlocks()
}

// 旋转    旋转后的行 = 旋转前的列   旋转后的列 = 3 - 旋转前的行
function rotate() {
  // 克隆出来的旋转不会影响到真是的
  var cloneCurrentModel = _.cloneDeep(currentModel)
  for (var k in cloneCurrentModel) {
    var blockModel = cloneCurrentModel[k]
    var temp = blockModel.row
    blockModel.row = blockModel.col
    blockModel.col = 3 -temp
  }
  if (isMeet(currentX, currentY, cloneCurrentModel)) {
    return;
  }
  // 如果旋转不会导致触碰，那么接受这次旋转
  currentModel = cloneCurrentModel
  locationBlocks()
}


// 下移至底部时固定，颜色改变，且出现新的模型 存储固定在底部坐标 fixedBottomModel
function fixedBottomModel() {
  var diveles = document.getElementsByClassName("activity_model")
  for (var i = diveles.length - 1; i>= 0; i--) {
    var divele = diveles[i]
    divele.className = "fixed-model"
    var blockModel = currentModel[i]
    fixedBlocks[(blockModel.row + currentY) + "_" + (blockModel.col + currentX)] = divele
  }
  createModel()
  // 判断是否铺满
  isRemoveLine()
}


// 模型之间的碰撞  isMeet
    // 判断将要移动到的位置是否已经存在被固定的块元素，存在为true 不存在为false
function isMeet(x, y, model) {
  for (var key in model) {
    var blockModel = model[key];
    if (fixedBlocks[(y + blockModel.row) + "_" + (x + blockModel.col)]) {
      return true;
    }
  }
  return false;
}
// 判断一行是否被铺满 isRemoveLine
function isRemoveLine() {
  // 如果一行中每一列都存在块元素，那么就表示该行已经被铺满了
  for (var i=0; i< ROW_COUNT; i++) {
    var count = 0
    for (var j=0; j< COL_COUNT; j++) {
      if (fixedBlocks[i +"_"+ j]) {
        count++
      }
    }
    if (count === COL_COUNT) {
      removeLine(i)
    }
  }
}
// 删除指定行 removeLine
function removeLine(line) {
  // 拿到当前行所有的块元素
  for (var i = 0; i < COL_COUNT; i++) {
    // 1、从容器中删除元素
    document.getElementById("container").removeChild(fixedBlocks[line + "_" + i]);
    // 2、从数据源中删除元素
    fixedBlocks[line + "_" + i] = null;
  }
  downLine(line)
}
// 让指定行之上的块元素下落 downLine
function downLine(line) {
  // 让指定行之上的所有行中的每一列的块元素，向下移动 1 个步长
  // 遍历指定行之上的所有行
  for (var i = (line - 1); i>=0; i--) {
    for (var j=0; j< COL_COUNT;j++) {
      // 如果当前列没有数据进入下一次循环
      if (!fixedBlocks[i + "_" + j]) continue
      // 1、平移数据，把当前行的数据给下一行
      fixedBlocks[(i+1) + "_" + j] = fixedBlocks[i + "_" + j]
      // 2、平移元素，让当前行的元素到下一行
      fixedBlocks[(i+1) + "_" + j].style.top = (i+1) *STEP + "px"
      // 3、清理掉平移之前的数据
      fixedBlocks[i + "_" + j] = null
    }
  }
}
// 让模型自动下落 autoDown
function autoDown() {
  if (timer) {
    clearInterval(timer)
  }
  timer = setInterval(function () {
    move(0, 1);
  },600)
}
// 判断游戏结束 isGameOver
function isGameOver() {
  // 当第0行存在块元素表示游戏结束
  for (var i=0; i< COL_COUNT; i++) {
    if (fixedBlocks["0_" + i]) {
      return true
    }
  }
}
// 结束掉游戏 gameOver
function gameOver() {
  clearInterval(timer)
  alert("游戏结束")
}
// 操作
window.onkeydown = function (e) {
  switch (e.keyCode) {
    case 37:
      move(-1,0)
      break
    case 38:
      rotate()
      break
    case 39:
      move(1,0)
      break
    case 40:
      move(0,1)
  }
}
// 在盒子范围内移动 checkBound
function checkBound() {
  var leftBound = 0;
  var rightBound = COL_COUNT;
  var bottomBound = ROW_COUNT;
  for (var k in currentModel) {
    var blockModel = currentModel[k]
    if((currentX + blockModel.col) < leftBound) {
      currentX++
    }
    if ((currentX + blockModel.col )>= rightBound) {
      currentX--
    }
    if ((blockModel.row + currentY) >= bottomBound) {
      currentY--
      fixedBottomModel()
    }
  }
}
