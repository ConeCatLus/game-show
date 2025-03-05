let draggedItem = null;

/* 🛠 Detect Device Type */
function isTouchDevice() {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

/* 🖱️ Enable Drag and Drop (PC) */
function enableMouseDragDrop() {
    let items = document.querySelectorAll(".sortable-item");

    items.forEach((item) => {
        item.draggable = true;
        item.addEventListener("dragstart", dragStart);
        item.addEventListener("dragover", allowDrop);
        item.addEventListener("drop", drop);
    });
}

/* 📱 Enable Touch Drag (Mobile) */
function enableTouchDragDrop() {
    let items = document.querySelectorAll(".sortable-item");

    items.forEach((item) => {
        item.addEventListener("touchstart", touchStart);
        item.addEventListener("touchmove", touchMove);
        item.addEventListener("touchend", touchEnd);
    });
}

/* 🖱️ Desktop Drag-and-Drop Functions */
function dragStart(event) {
    draggedItem = event.target;
    event.dataTransfer.setData("text/plain", draggedItem.dataset.index);
}

function allowDrop(event) {
    event.preventDefault();
}

function drop(event) {
    event.preventDefault();
    let target = event.target;

    if (draggedItem && target.classList.contains("sortable-item")) {
        swapElements(draggedItem, target);
    }
}

/* 📱 Mobile Touch Drag Functions */
function touchStart(event) {
    draggedItem = event.target;
    draggedItem.classList.add("dragging");
}

function touchMove(event) {
    event.preventDefault();
    let touchLocation = event.touches[0];
    let target = document.elementFromPoint(touchLocation.clientX, touchLocation.clientY);

    if (target && target.classList.contains("sortable-item") && target !== draggedItem) {
        swapElements(draggedItem, target);
    }
}

function touchEnd(event) {
    if (draggedItem) {
        draggedItem.classList.remove("dragging");
        draggedItem = null;
    }
}

/* 🔄 Swap Function (Works for Both Mouse and Touch) */
function swapElements(el1, el2) {
    let parent = el1.parentNode;
    let el1Clone = el1.cloneNode(true);
    let el2Clone = el2.cloneNode(true);

    parent.replaceChild(el1Clone, el2);
    parent.replaceChild(el2Clone, el1);

    // Re-enable event listeners on swapped elements
    initializeDragDrop();
    // 📝 Update player's answer after reordering
    updatePlayerAnswer();
}

/* 📝 Function to Update Player's Answer */
function updatePlayerAnswer() {
    let items = Array.from(document.querySelectorAll("#sortable-list .sortable-item"));
    playerAnswer = items.map(el => el.innerText);
    console.log("Updated player answer:", playerAnswer);
}

/* 🔥 Initialize Based on Device Type */
function initializeDragDrop() {
    if (isTouchDevice()) {
        console.log("Using touch-based drag-and-drop");
        enableTouchDragDrop();
    } else {
        console.log("Using mouse-based drag-and-drop");
        enableMouseDragDrop();
    }
}
