let currentPostElement = null;
let currentUserData = {};
let currentUserId = "";

function loginWithValidation(event) {
  event.preventDefault();

  const id = document.getElementById("loginId").value.trim();
  const pw = document.getElementById("loginPw").value.trim();

  const idRegex = /^[a-zA-Z0-9]{4,12}$/;
  const pwRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{6,}$/;

  if (!idRegex.test(id)) {
    alert("아이디는 영문자+숫자 조합 4~12자여야 합니다.");
    return;
  }

  if (!pwRegex.test(pw)) {
    alert("비밀번호는 대문자, 숫자, 특수문자를 포함해야 합니다.");
    return;
  }

  const saved = localStorage.getItem(`mypage_user_${id}`);
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed.password === pw) {
      currentUserId = id;
      currentUserData = parsed;

      if (currentUserData.name) {
        showMainPage();
      } else {
        document.querySelector("#loginPage").style.display = "none";
        document.querySelector("#nameInputPage").style.display = "block";
      }
    } else {
      alert("비밀번호가 틀렸습니다.");
    }
  } else {
    currentUserId = id;
    currentUserData = { password: pw };
    document.querySelector("#loginPage").style.display = "none";
    document.querySelector("#nameInputPage").style.display = "block";
  }
}

function completeRegistration() {
  const name = document.querySelector("#usernameInput").value.trim();
  if (!name) {
    alert("이름을 입력해주세요.");
    return;
  }

  currentUserData.name = name;
  localStorage.setItem(
    `mypage_user_${currentUserId}`,
    JSON.stringify(currentUserData)
  );

  document.querySelector("#nameInputPage").style.display = "none"; 
  showMainPage();
}

function showMainPage() {
  document.querySelector("#loginPage").style.display = "none";
  document.querySelector("#nameInputPage").style.display = "none";
  document.querySelector("#mainPage").style.display = "block";

  const name = currentUserData.name || "회원";
  document.querySelector("#welcomeMsg").innerText =
    `환영합니다, ${currentUserData.name || "회원"}님!`;

  document.querySelector("#profileName").innerText = currentUserData.name;
  document.querySelector("#profileIntro").innerText = currentUserData.intro || "안녕하세요! 반갑습니다.";
  if (currentUserData.image) {
    document.querySelector("#profileImage").src = currentUserData.image;
  }

  renderAllPosts();
  switchCategory("board");
}


function showModal() {
    document.getElementById("modalOverlay").classList.remove("hidden");
}

function closeModal(event) {
    event.stopPropagation();
    document.getElementById("modalOverlay").classList.add("hidden");
}


function saveUserData() {
  if (!currentUserId || !currentUserData) return;

  localStorage.setItem(
    `mypage_user_${currentUserId}`,
    JSON.stringify(currentUserData)
  );
}

function toggleEdit() {
  const form = document.querySelector("#editForm");
  form.style.display = form.style.display === "block" ? "none" : "block";
}

function saveProfile() {
  const imageInput = document.querySelector("#newImage");
  const intro = document.querySelector("#newIntro").value.trim();
  const file = imageInput.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.querySelector("#profileImage").src = e.target.result;
      currentUserData.image = e.target.result;
      saveUserData();
    };
    reader.readAsDataURL(file);
  }

  if (intro) {
    document.querySelector("#profileIntro").innerText = intro;
    currentUserData.intro = intro;
  }

  saveUserData();
  document.querySelector("#editForm").style.display = "none";
}

function togglePostForm() {
  document.querySelector("#postForm").classList.toggle("hidden");
}


function submitPost() {
  
  const title = document.querySelector("#postTitle").value.trim();
  const content = document.querySelector("#postContent").value.trim();
  const imageInput = document.querySelector("#postImage");

  if (!title || !content) return alert("제목과 내용을 모두 입력해주세요.");

  if (!currentUserData.posts) {
  currentUserData.posts = [];
}

  const file = imageInput.files[0];
  const post = { title, content, image: "", createdAt: Date.now(), viewCount: 0, comments: [] };

  const finalizePost = () => {
    currentUserData.posts.push(post);
    saveUserData();
    renderAllPosts();

    document.querySelector("#postTitle").value = "";
    document.querySelector("#postContent").value = "";
    imageInput.value = "";
    document.querySelector("#postForm").classList.add("hidden");
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      post.image = e.target.result;
      finalizePost();
    };
    reader.readAsDataURL(file);
  } else {
    finalizePost();
  }
}

function renderAllPosts() {
  const list = document.querySelector("#postList");
  list.innerHTML = "";

  currentUserData.posts.forEach((post) => {
    const li = document.createElement("li");
    Object.assign(li.dataset, post);
    li.comments = post.comments || [];

    const span = document.createElement("span");
    span.innerText = `${post.title} (조회수: ${post.viewCount})`;
    li.appendChild(span);

    attachPostClickEvent(li);
    list.appendChild(li);
  });

  sortPosts();
}

function sortPosts() {
  const option = document.querySelector("#sortOption").value;
  const list = document.querySelector("#postList");
  const posts = Array.from(list.children);

  posts.sort((a, b) => {
    const aVal = a.dataset, bVal = b.dataset;
    if (option === "latest") return bVal.createdAt - aVal.createdAt;
    if (option === "oldest") return aVal.createdAt - bVal.createdAt;
    if (option === "name") return aVal.title.localeCompare(bVal.title);
    if (option === "views") return bVal.viewCount - aVal.viewCount;
  });

  list.innerHTML = "";
  posts.forEach(post => list.appendChild(post));
}

function attachPostClickEvent(li) {
  li.onclick = () => {
    li.dataset.viewCount = parseInt(li.dataset.viewCount) + 1;
    currentPostElement = li;

    document.querySelector("#detailTitle").innerText = `${li.dataset.title} (조회수: ${li.dataset.viewCount})`;
    document.querySelector("#detailContent").innerText = li.dataset.content;
    const img = document.querySelector("#detailImage");
    img.src = li.dataset.image || "";
    img.style.display = li.dataset.image ? "block" : "none";

    li.querySelector("span").innerText = `${li.dataset.title} (조회수: ${li.dataset.viewCount})`;
    renderAllComments();
    document.querySelector("#postDetail").classList.remove("hidden");
  };
}

function closeDetail() {
  document.querySelector("#postDetail").classList.add("hidden");
}

function deletePost() {
  if (!currentPostElement || !confirm("정말 삭제하시겠습니까?")) return;
  const title = currentPostElement.dataset.title;
  currentUserData.posts = currentUserData.posts.filter(p => p.title !== title);
  currentPostElement.remove();
  saveUserData();
  closeDetail();
}

function editPost() {
  if (!currentPostElement) return;
  const newTitle = prompt("새 제목을 입력하세요", currentPostElement.dataset.title);
  const newContent = prompt("새 내용을 입력하세요", currentPostElement.dataset.content);
  const newImage = prompt("이미지 URL 입력 (선택)", currentPostElement.dataset.image);
  if (newTitle && newContent !== null) {
    Object.assign(currentPostElement.dataset, { title: newTitle, content: newContent, image: newImage });
    currentPostElement.querySelector("span").innerText = `${newTitle} (조회수: ${currentPostElement.dataset.viewCount})`;
    document.querySelector("#detailTitle").innerText = `${newTitle} (조회수: ${currentPostElement.dataset.viewCount})`;
    document.querySelector("#detailContent").innerText = newContent;
    saveUserData();
    sortPosts();
  }
}

function addComment() {
  if (!currentPostElement) return;
  const name = document.querySelector("#commentName").value.trim();
  const content = document.querySelector("#commentContent").value.trim();
  if (!name || !content) return alert("이름과 댓글 내용을 모두 입력해주세요.");

  const comment = { name, content, date: new Date().toLocaleString(), deleted: false };
  currentPostElement.comments.push(comment);
  saveUserData();
  renderAllComments();
  document.querySelector("#commentName").value = "";
  document.querySelector("#commentContent").value = "";
}

function renderAllComments() {
  const commentList = document.querySelector("#commentList");
  commentList.innerHTML = "";
  currentPostElement.comments.forEach((c, i) => renderComment(c, i));
}

function renderComment(comment, index) {
  const li = document.createElement("li");
  li.className = "comment-item";

  const nameSpan = document.createElement("span");
  nameSpan.innerText = `${comment.name}: `;
  const contentSpan = document.createElement("span");
  contentSpan.innerText = comment.content;
  const dateSpan = document.createElement("span");
  dateSpan.innerText = ` (${comment.date})`;
  dateSpan.style.fontSize = "0.8em";
  dateSpan.style.color = "#888";

  li.append(nameSpan, contentSpan, dateSpan);

  if (!comment.deleted) {
    const editBtn = document.createElement("button");
    editBtn.innerText = "수정";
    editBtn.onclick = () => {
      const newContent = prompt("댓글 수정:", comment.content);
      if (newContent !== null && newContent.trim() !== "") {
        comment.content = newContent;
        saveUserData();
        renderAllComments();
      }
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.innerText = "삭제";
    deleteBtn.onclick = () => {
      if (confirm("정말 댓글을 삭제하시겠습니까?")) {
        comment.content = "삭제된 메세지입니다.";
        comment.deleted = true;
        saveUserData();
        renderAllComments();
      }
    };

    li.append(editBtn, deleteBtn);
  } else {
    contentSpan.style.fontStyle = "italic";
    contentSpan.style.color = "#888";
  }

  document.querySelector("#commentList").appendChild(li);
}

function logout() {
  currentUserId = "";
  currentUserData = null;

  // 화면 초기화
  document.querySelector("#mainPage").style.display = "none";
  document.querySelector("#loginPage").style.display = "flex";
  document.querySelector("#nameInputPage").style.display = "none";

  // 입력 필드 초기화
  document.querySelector("#loginId").value = "";
  document.querySelector("#loginPw").value = "";
  document.querySelector("#usernameInput").value = "";
}

function switchCategory(name) {
  const sections = {
    todo: document.getElementById("todoSection"),
    board: document.getElementById("postSection"),
    game: document.getElementById("gameSection"),
  };

  for (let key in sections) {
    if (sections[key]) {
      sections[key].classList.toggle("hidden", key !== name);
    }
  }

  document.querySelectorAll(".category-menu li").forEach(li => {
    const category = li.dataset.category;
    li.classList.toggle("active", category === name);
    // li.classList.toggle(
    //   "active",
    //   li.innerText.includes(
    //     name === "board" ? "게시판" :
    //     name === "game" ? "개발중" :
    //     "todo"
    //   )
    // );
  });
}

function addTodo(button) {
  const column = button.closest(".todo-column");
  const input = column.querySelector(".todo-input");
  const priority = column.querySelector(".priority-select").value;
  const text = input.value.trim();
  // const text = input.value.trim();
  if (!text) return;

  const item = createTodoItem(text, priority);
  column.querySelector(".todo-list").appendChild(item);
  input.value = "";
}

function createTodoItem(text, priority = "normal") {
  const item = document.createElement("div");
  item.className = `todo-item priority-${priority}`;
  item.draggable = true;
  item.ondragstart = drag;

  const span = document.createElement("span");
  span.innerText = text;

  const deleteBtn = document.createElement("button");
  deleteBtn.innerText = "✖";
  deleteBtn.className = "delete-btn";
  deleteBtn.onclick = () => item.remove();

  item.appendChild(span);
  item.appendChild(deleteBtn);
  // item.innerText = text;
  return item;
}

function drag(event) {
  const item = event.target;
  // event.dataTransfer.setData("text/plain", event.target.innerText);
  event.dataTransfer.setData("text/html", event.target.outerHTML);
  event.target.classList.add("dragging");
  setTimeout(() => event.target.remove(), 0);
  // event.dataTransfer.setData("todo-id", event.target.id);
  // event.target.classList.add("dragging");
}

function allowDrop(event) {
  event.preventDefault();
}

function drop(event) {
  event.preventDefault();
  // const text = event.dataTransfer.getData("text/plain");
  const html = event.dataTransfer.getData("text/html");
  const container = event.target.closest(".todo-list");
  container.insertAdjacentHTML("beforeend", html);
  // const priority = event.dataTransfer.getData("priority") || "normal";
  // const item = createTodoItem(text);
  // event.target.closest(".todo-list").appendChild(item);

  const newItem = container.lastElementChild;
  newItem.ondragstart = drag;

  // x 버튼 재설정 (이전 이벤트 사라졌기 때문에 다시 연결)
  const deleteBtn = newItem.querySelector(".delete-btn");
  if(deleteBtn) deleteBtn.onclick = () => newItem.remove();
}

function getPriorityFromClass(className) {
  if (className.includes("priority-high")) return "high";
  if (className.includes("priority-low")) return "low";
  return "normal";
}
