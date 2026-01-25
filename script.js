const game = document.getElementById("game")
const container = document.getElementById("container")
const fish = document.getElementById("fish")
const bar = document.getElementById("bar")
const fill = document.getElementById("fill")

const fishNameText = document.getElementById("fishName")
const rarityText = document.getElementById("rarity")
const scoreText = document.getElementById("score")
const skipBtn = document.getElementById("skipBtn")
const winScreen = document.getElementById("winScreen")

const shop = document.getElementById("shop")
const shopArrow = document.getElementById("shopArrow")
const rodList = document.getElementById("rodList")

const settingsBtn = document.getElementById("settingsBtn")
const settingsModal = document.getElementById("settingsModal")
const closeSettingsBtn = document.getElementById("closeSettingsBtn")
const musicSelect = document.getElementById("musicSelect")
const muteCheckbox = document.getElementById("muteCheckbox")

const aboutAuthorsBtn = document.getElementById("aboutAuthorsBtn")
const aboutModal = document.getElementById("aboutModal")
const closeAboutBtn = document.getElementById("closeAboutBtn")

const bgmTracks = [
  document.getElementById("bgm1"),
  document.getElementById("bgm2")
]

let selectedBgm = bgmTracks[0]
selectedBgm.volume = 0.35

const WIN_SCORE = 1000
const MAX_BAR_SPEED = 5

let holding = false
let barY = 150
let barVelocity = 0
let fishY = 100
let fishSpeed = 2
let progress = 0
let score = 0
let gameWon = false

let ownedRods = []
let activeRod = null

const baseFish = [
  { name:"Sunfish", rarity:"Common", sprite:"sprites/sunfish.png", speed:1.6, points:10, weight:40 },
  { name:"Minnow", rarity:"Common", sprite:"sprites/sunfish.png", speed:1.4, points:8, weight:40 },
  { name:"Bluegill", rarity:"Common", sprite:"sprites/sunfish.png", speed:1.5, points:10, weight:40 },

  { name:"Catfish", rarity:"Uncommon", sprite:"sprites/catfish.png", speed:2.4, points:25, weight:25 },
  { name:"Perch", rarity:"Uncommon", sprite:"sprites/catfish.png", speed:2.6, points:25, weight:25 },

  { name:"Swordfish", rarity:"Rare", sprite:"sprites/swordfish.png", speed:3.4, points:50, weight:15 },
  { name:"Marlin", rarity:"Rare", sprite:"sprites/swordfish.png", speed:3.6, points:55, weight:15 },

  { name:"Crimson Leviathan", rarity:"Legendary", sprite:"sprites/leviathan.png", speed:4.8, points:150, weight:5, jitter:true }
]

let fishPool = [...baseFish]
let currentFish = null

const rods = [
  {
    name:"Basic Rod",
    cost:150,
    weights:{ Common:32, Uncommon:34, Rare:18, Legendary:6 },
    sprite:"sprites/rod1.png"
  },
  {
    name:"Advanced Rod",
    cost:350,
    weights:{ Common:10, Uncommon:50, Rare:25, Legendary:15 },
    sprite:"sprites/rod2.png"
  },
  {
    name:"Master Rod",
    cost:500,
    weights:{ Common:0, Uncommon:20, Rare:50, Legendary:30 },
    sprite:"sprites/rod3.png"
  }
]

function rebuildFishPool() {
  fishPool = []
  const weights = activeRod ? activeRod.weights : null

  baseFish.forEach(f => {
    let w = f.weight
    if (weights && weights[f.rarity] !== undefined) {
      w = weights[f.rarity]
    }
    fishPool.push({ ...f, weight:w })
  })
}

function getRandomFish() {
  const total = fishPool.reduce((s,f)=>s+f.weight,0)
  let r = Math.random() * total
  for (const f of fishPool) {
    if (r < f.weight) return f
    r -= f.weight
  }
  return fishPool[0]
}

function spawnFish() {
  progress = 0
  fill.style.height = "0%"
  currentFish = getRandomFish()

  fish.style.backgroundImage = `url(${currentFish.sprite})`
  fish.classList.toggle("legendary", currentFish.rarity === "Legendary")

  fishNameText.textContent = "Fish: " + currentFish.name
  rarityText.textContent = "Rarity: " + currentFish.rarity

  fishY = Math.random() * (game.clientHeight - fish.clientHeight)
  fishSpeed = currentFish.speed * (Math.random() > 0.5 ? 1 : -1)

  container.classList.toggle("shake", currentFish.rarity === "Legendary")
}

function renderShop() {
  rodList.innerHTML = ""
  rods.forEach((rod, i) => {
    const d = document.createElement("div")
    d.className = "rodItem"

    const prevOwned = i === 0 || ownedRods.includes(i-1)
    if (score < rod.cost || !prevOwned || ownedRods.includes(i)) {
      d.classList.add("disabled")
    }

    d.innerHTML = `<img src="${rod.sprite}"><div>${rod.name} (${rod.cost})</div>`
    if (!d.classList.contains("disabled")) {
      d.onclick = () => buyRod(i)
    }
    rodList.appendChild(d)
  })
}

function buyRod(i) {
  const rod = rods[i]
  if (score < rod.cost) return
  score -= rod.cost
  ownedRods.push(i)
  activeRod = rod
  rebuildFishPool()
  scoreText.textContent = `Score: ${score} / ${WIN_SCORE}`
  renderShop()
}

function updateFish() {
  fishY += fishSpeed
  if (currentFish.jitter) fishY += (Math.random()-0.5)*4

  if (fishY <= 0 || fishY >= game.clientHeight - fish.clientHeight) {
    fishSpeed *= -1
  }
  fish.style.top = fishY + "px"
}

function updateBar() {
  barVelocity += holding ? -0.6 : 0.5
  barVelocity = Math.max(-MAX_BAR_SPEED, Math.min(MAX_BAR_SPEED, barVelocity))
  barVelocity *= 0.9
  barY += barVelocity
  barY = Math.max(0, Math.min(game.clientHeight - bar.clientHeight, barY))
  bar.style.top = barY + "px"
}

function checkOverlap() {
  const hit = barY < fishY + fish.clientHeight && barY + bar.clientHeight > fishY
  progress += hit ? 0.7 : -0.6
  progress = Math.max(0, Math.min(100, progress))
  fill.style.height = progress + "%"

  if (progress >= 100) {
    score += currentFish.points
    scoreText.textContent = `Score: ${score} / ${WIN_SCORE}`
    container.classList.remove("shake")
    if (score >= WIN_SCORE) winScreen.style.display = "flex"
    spawnFish()
    renderShop()
  }
}

shopArrow.onclick = () => shop.classList.toggle("open")

settingsBtn.onclick = () => settingsModal.style.display = "flex"
closeSettingsBtn.onclick = () => settingsModal.style.display = "none"
aboutAuthorsBtn.onclick = () => aboutModal.style.display = "flex"
closeAboutBtn.onclick = () => aboutModal.style.display = "none"

musicSelect.onchange = () => {
  selectedBgm.pause()
  selectedBgm.currentTime = 0
  selectedBgm = bgmTracks[musicSelect.value]
  if (!muteCheckbox.checked) selectedBgm.play()
}

muteCheckbox.onchange = () => {
  if (muteCheckbox.checked) selectedBgm.pause()
  else selectedBgm.play()
}

document.addEventListener("mousedown",()=>{holding=true;selectedBgm.play()})
document.addEventListener("mouseup",()=>holding=false)
document.addEventListener("keydown",e=>{
  if(e.code==="Space") holding=true
  if(e.ctrlKey&&e.shiftKey&&e.code==="KeyP"){
    const v=parseInt(prompt("Secret score:"),10)
    if(!isNaN(v)){score=v;scoreText.textContent=`Score: ${score} / ${WIN_SCORE}`;renderShop()}
  }
})
document.addEventListener("keyup",e=>{if(e.code==="Space") holding=false})

game.addEventListener("touchstart",e=>{e.preventDefault();holding=true;selectedBgm.play()})
game.addEventListener("touchend",()=>holding=false)

skipBtn.onclick = ()=>spawnFish()

rebuildFishPool()
spawnFish()
renderShop()

function loop(){
  if(!gameWon){
    updateFish()
    updateBar()
    checkOverlap()
    requestAnimationFrame(loop)
  }
}
loop()

