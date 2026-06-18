// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB_nBh0Pv-7ztdvsUa_Pw-WUDk7_dVOuj0",
  authDomain: "afireforge-site.firebaseapp.com",
  projectId: "afireforge-site",
  storageBucket: "afireforge-site.firebasestorage.app",
  messagingSenderId: "324207239248",
  appId: "1:324207239248:web:a897294c85b4e27baa3155",
  measurementId: "G-BS7HQQPREZ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Прочее
let cart = [];
let currentProduct = null;
let productsLoaded = false;
let myProductsLoaded = false;

// Вспомогательная функция: показывать нужную страницу
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
}

// Если пользователь уже авторизован — показывать каталог
auth.onAuthStateChanged(user => {

    const userName =
        document.getElementById("userName");

    const logoutBtn =
        document.getElementById("logoutBtn");

        const loginBtn =
            document.getElementById("loginBtn");

        const registerBtn =
            document.getElementById("registerBtn");

    if (user) {

        showPage("mainPage");

        userName.textContent =
            user.displayName || user.email;

        logoutBtn.style.display =
            "inline-block";

        loginBtn.style.display = "none";
        registerBtn.style.display = "none";

        logoutBtn.style.display = "inline-block";

        loadProducts();

        showHome();
    }
    else {
        showPage("mainPage");

        userName.textContent = "Гость";

        loginBtn.style.display = "inline-block";
        registerBtn.style.display = "inline-block";

        logoutBtn.style.display = "none";

        loadProducts();

        showHome();
    }
});

// Регистрация
function register() {
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const name = document.getElementById('registerName').value;
    auth.createUserWithEmailAndPassword(email, password)
        .then(credential => {
            return credential.user.updateProfile({ displayName: name });
        })
        .then(() => {
            alert('Регистрация прошла успешно!');
            showPage('mainPage');
            loadProducts();
        })
        .catch(error => alert('Ошибка: ' + error.message));
}

// Вход
function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            alert('Добро пожаловать!');
            showPage('mainPage');
            loadProducts();
        })
        .catch(error => alert('Ошибка: ' + error.message));
}

// Выйти
function logout() {
    auth.signOut();
}

function enterAsGuest() {

    showPage("mainPage");

    document.getElementById("userName")
        .textContent = "Гость";

    loadProducts();

    showHome();
}

// Показать окно добавления товара
function showAddProduct() {

    if (!auth.currentUser) {
        alert(
            "Для добавления товаров необходимо войти в аккаунт"
        );

        return;
    }
    document.getElementById('addProductForm').style.display = 'block';
}
function hideAddProduct() {
    document.getElementById('addProductForm').style.display = 'none';
}

// Добавить товар
function addProduct() {
    const name = document.getElementById('newName').value.trim();
    const price = parseFloat(document.getElementById('newPrice').value);
    const imageUrl = document.getElementById('newImageUrl').value.trim();
    const description = document.getElementById("newDescription").value.trim();

    if (!name || isNaN(price) || !imageUrl) {
        alert('Поля заполнены некорректно');
        return;
    }

    db.collection('products').add({

        name: name,
        price: price,
        imageUrl: imageUrl,
        description: description,

        ownerId: auth.currentUser.uid,
        ownerName: auth.currentUser.displayName
    }).then(() => {
        alert('Товар добавлен');
        document.getElementById('newName').value = '';
        document.getElementById('newPrice').value = '';
        document.getElementById('newImageUrl').value = '';
        hideAddProduct();
        loadProducts();
    }).catch(error => alert('Ошибка: ' + error.message));
}

// Загрузка товаров
function loadProducts() {
    const container = document.getElementById('products');
    container.innerHTML = '';

    db.collection('products').get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const product = doc.data();
                const div = document.createElement('div');
                div.className = 'product';

                div.innerHTML = `
                    <h4>${product.name}</h4>

                    <img src="${product.imageUrl}"
                        alt="${product.name}"/>

                    <p class="price">${product.price} ₽</p>

                    <p>
                        Продавец:
                        ${product.ownerName || "Неизвестно"}
                    </p>
                `;

                div.onclick = () => {
                    openProduct(product);
                };

                container.appendChild(div);
            });
        })
        .catch(error => alert('Ошибка загрузки товаров: ' + error.message));
}

function loadMyProducts() {
    const container =
        document.getElementById("myProducts");

    container.innerHTML = "";

    db.collection("products")
        .where(
            "ownerId",
            "==",
            auth.currentUser.uid
        )
        .get()
        .then(snapshot => {

            snapshot.forEach(doc => {

                const product =
                    doc.data();

                const div =
                    document.createElement("div");

                div.className = "product";

                div.innerHTML = `
                    <h4>${product.name}</h4>

                    <img src="${product.imageUrl}">

                    <p>
                        Цена:
                        ${product.price} руб.
                    </p>
                `;

                // Добавим возможность удалить товар (опционально)
                const delBtn = document.createElement('button');
                delBtn.innerText = 'Удалить';
                delBtn.onclick = () => {
                    if (confirm('Удалить этот товар?')) {
                        db.collection('products').doc(doc.id).delete().then(() => {
                            loadProducts();
                        });
                    }
                };
                div.appendChild(delBtn);

                container.appendChild(div);

            });

        });
}

function openProduct(product) {

    currentProduct = product;

    document.getElementById("modalName")
        .textContent = product.name;

    document.getElementById("modalPrice")
        .textContent =
            "Цена: " + product.price + " руб.";

    document.getElementById("modalDescription")
        .textContent =
            product.description || "Описание отсутствует";

    document.getElementById("modalSeller")
        .textContent =
            "Продавец: " + product.ownerName;

    document.getElementById("modalImage")
        .src = product.imageUrl;

    // Сбрасываем количество
    document.getElementById("modalQuantity")
        .value = 1;

    document.getElementById("productModal")
        .style.display = "flex";
}

function closeProduct() {

    document.getElementById("productModal")
        .style.display = "none";
}

function addToCart() {

    const quantity =
        parseInt(
            document.getElementById("modalQuantity").value
        );

    const existingItem =
        cart.find(
            item => item.name === currentProduct.name
        );

    if(existingItem) {

        existingItem.quantity += quantity;
    }
    else {

        cart.push({
            name: currentProduct.name,
            price: currentProduct.price,
            imageUrl: currentProduct.imageUrl,
            quantity: quantity
        });
    }

    alert("Товар добавлен в корзину!");

    closeProduct();
}

function loadCart() {

    const container =
        document.getElementById("cartItems");

    container.innerHTML = "";

    let total = 0;

    cart.forEach((item, index) => {

        const itemTotal =
            item.price * item.quantity;

        total += itemTotal;

        const div =
            document.createElement("div");

        div.className = "product";

        div.innerHTML = `
            <img src="${item.imageUrl}">
            <h4>${item.name}</h4>
            <p>Количество: ${item.quantity}</p>
            <p>Цена: ${itemTotal} руб.</p>
        `;

        const removeBtn =
            document.createElement("button");

        removeBtn.textContent =
            "Удалить";

        removeBtn.onclick = () => {

            cart.splice(index, 1);

            loadCart();
        };

        div.appendChild(removeBtn);

        container.appendChild(div);
    });

    const totalDiv =
        document.createElement("h3");

    totalDiv.textContent =
        "Итого: " + total + " руб.";

    container.appendChild(totalDiv);
}

function checkout() {

    if(cart.length === 0) {

        alert("Корзина пуста");

        return;
    }

    alert("Платёж успешно выполнен!");

    cart = [];

    loadCart();
}

function showLogin() {
    showPage('loginPage');
}

function showRegister() {
    showPage('registerPage');
}

function showHome() {
    document.getElementById("homePage").style.display = "block";
    document.getElementById("cartPage").style.display = "none";
    document.getElementById("storePage").style.display = "none";
}

function showCart() {
    document.getElementById("homePage").style.display = "none";
    document.getElementById("cartPage").style.display = "block";
    document.getElementById("storePage").style.display = "none";

    loadCart();
}

function showStore() {

    if (!auth.currentUser) {

        document.getElementById("homePage").style.display = "block";
        document.getElementById("cartPage").style.display = "none";
        document.getElementById("storePage").style.display = "none";

        document.getElementById("guestStoreMessage").style.display = "block";
        document.getElementById("addProductBtn").style.display = "none";

        alert(
            "Свой магазин доступен только авторизованным пользователям"
        );

        return;
    }

    document.getElementById("guestStoreMessage").style.display = "none";

    document.getElementById("homePage").style.display = "none";
    document.getElementById("cartPage").style.display = "none";
    document.getElementById("storePage").style.display = "block";
    document.getElementById("addProductBtn").style.display = "inline-block";

    loadMyProducts();
}

window.login = login;
window.register = register;
window.logout = logout;
window.showLogin = showLogin;
window.showRegister = showRegister;
window.showAddProduct = showAddProduct;
window.hideAddProduct = hideAddProduct;
window.addProduct = addProduct;
window.showHome = showHome;
window.showCart = showCart;
window.showStore = showStore;
window.checkout = checkout;