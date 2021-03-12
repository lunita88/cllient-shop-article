var user = {
    apiServer: API_URL + ':' + API_PORT,
    token: '',
    authButtonsContainerId: 'auth-buttons',
    authButtonsTemplate: `
        <div class="btn-group">
            <div class="dropdown">
                <button class="btn btn-outline-success btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">Login</button>
                <div class="dropdown-menu dropdown-menu-end px-2">
                    <small>
                        <div class="alert alert-danger p-1 d-none" role="alert" id="login-alert">
                        Error user not found!
                        </div>
                    </small>
                    <form id="form-login">
                        <input type="email" class="form-control form-control-sm" id="login-email" placeholder="Email" required>
                        <input type="password" class="form-control form-control-sm my-1" id="login-password" placeholder="Password" required>
                        <button type="submit" class="btn btn-primary btn-sm mt-2" id="login-button">Submit</button>
                    </form>
                </div>
            </div>
        </div>
        <div class="btn-group">
            <div class="dropdown">
                <button class="btn btn-outline-success btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">Signup</button>
                <div class="dropdown-menu dropdown-menu-end px-2" id="signupDropdown">
                    <small>
                        <div class="alert alert-danger p-1 d-none" role="alert" id="signup-alert">
                        Error!
                        </div>
                    </small>
                    <form id="form-signup">
                        <input type="email" class="form-control form-control-sm" id="signup-email" placeholder="Email" required>
                        <input type="password" class="form-control form-control-sm my-1" id="signup-password" placeholder="Password" required>
                        <input type="password" class="form-control form-control-sm" id="signup-password-repeat" placeholder="Repeat Password" required>
                        <button class="btn btn-primary btn-sm mt-1" id="signup-button">Submit</button>
                    </form>
                </div>
            </div>
        </div>`.trim(),
    logoutButtonTemplate: '<button class="btn btn-outline-success btn-sm mx-1" type="button" id="logout-button">Logout</button>',
    init: function () {
        if (this.isLoggedIn()) {
            this.dispatchLoggedInEvent(this.token);
        } else {
            user.showAuthButtons();
        }
    },
    showAuthButtons: function () {
        document.getElementById(this.authButtonsContainerId).innerHTML = this.authButtonsTemplate;
        document.getElementById('form-login').addEventListener('submit', evt => {
            //console.log('submit login form');
            evt.preventDefault();
            this.submitLoginData();
            return false;
        });

        document.getElementById('form-signup').addEventListener('submit', evt => {
            //console.log('submit login form');
            evt.preventDefault();
            this.submitSignupData();
            return false;
        });
        
        //document.getElementById('loginButton').onclick = this.submitLoginData.bind(this);
        //document.getElementById('signupButton').onclick = this.submitSignupData.bind(this);
        //if (typeof errMsg == 'string') this.showError(errMsg);
    },
    submitLoginData: function () {
        console.log('submit login data');

        var email = document.getElementById('login-email').value;
        var password = document.getElementById('login-password').value;

        if (! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            this.showError("Invalid email format!", 'login-alert');
            return;
        }
        if (password.length < 8) {
            this.showError("Password needs at least 8 characters!", 'login-alert');
            return;
        }
        
        this.hideError('login-alert');
        this.showSpinnerButton('login-button');

        //this.dispatchLoggedInEvent();


        var user = {
            'email': email,
            'password': password
        }
        const xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (xhttp.readyState == 4) {
                this.hideSpinnerButton('login-button');
                switch (xhttp.status) {
                    case 200:
                        var res = JSON.parse(xhttp.responseText);
                        //console.log(res);
                        console.log(this.parseJwt(res.token));
                        localStorage.setItem('token', res.token);
                        //this.exitAuthAndMsg('Login success. You may access protected route.');
                        //book.showBookPage();
                        this.dispatchLoggedInEvent(res.token);
                        break;
                    case 401:
                        //console.log(xhttp.responseText);
                        var res = JSON.parse(xhttp.responseText);
                        this.showError(res.message, 'login-alert');
                        break;
                    default:
                        console.log('unknown error');
                        this.showError("Unknown Error Occured. Server response not received. Try again later.", 'login-alert');
                }
            }
        }.bind(this);

        xhttp.open("POST", this.apiServer + '/user/login', true);
        xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhttp.send(JSON.stringify(user));
    },
    submitSignupData: function () {
        var email = document.getElementById('signup-email').value;
        var password = document.getElementById('signup-password').value;
        var repeatPassword = document.getElementById('signup-password-repeat').value;

        // test email format https://ui.dev/validate-email-address-javascript/
        if (! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            this.showError("Invalid email format!", 'signup-alert');
            return;
        }
        if (password !== repeatPassword) {
            this.showError("Passwords doesn't match!", 'signup-alert');
            return;
        } else {
            if (password.length < 8) {
                this.showError("Password must be at leat 8 characters long!", 'signup-alert');
                return;
            }
        }

        this.hideError('signup-alert');
        this.showSpinnerButton('signup-button');

        var user = {
            'email': email,
            'password': password
        }
        //console.log(user);
        const xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (xhttp.readyState == 4) {
                this.hideSpinnerButton('signup-button');
                switch (xhttp.status) {
                    case 200:
                        var res = JSON.parse(xhttp.responseText);
                        console.log(res);
                        this.dispatchLoggedInEvent(res.token);
                        break;
                    case 403:
                        var res = JSON.parse(xhttp.responseText);
                        console.log(res);
                        this.showError(res.message, 'signup-alert');
                        break;
                    default:
                        console.log("unknown error");
                        this.showError("Unknown Error Occured. Server response not received. Try again later.", 'signup-alert');
                }
            }
        }.bind(this);

        xhttp.open("POST", this.apiServer + '/user/signup', true);
        xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhttp.send(JSON.stringify(user));
    },
    dispatchLoggedInEvent: function (token) {
        document.getElementById(this.authButtonsContainerId).innerHTML = this.logoutButtonTemplate;
        document.getElementById('logout-button').addEventListener('click', evt => {
            this.logout();
        });
        document.dispatchEvent(new CustomEvent('logged-in', { detail: token }));
    },
    showError: function (msg, id) {
        var errorAlert = document.getElementById(id);
        errorAlert.textContent = msg;
        errorAlert.classList.remove('d-none');
    },
    hideError: function (id) {
        var errorAlert = document.getElementById(id);
        errorAlert.classList.add('d-none');
    },
    showSpinnerButton: function (id) {
        var btn = document.getElementById(id);
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span> Please wait...';
    },
    hideSpinnerButton: function (id) {
        var btn = document.getElementById(id);
        btn.disabled = false;
        btn.innerHTML = "Submit";
    },
    logout: function () {
        // to logout user just set token to empty string
        localStorage.setItem('token', '');
        document.getElementById(this.authButtonsContainerId).innerHTML = this.authButtonsTemplate;
        document.dispatchEvent(new Event('logged-out'));
        //location.reload();
    },
    getToken: function () {
        return localStorage.getItem('token');
    },
    parseJwt: function (token) {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    
        return JSON.parse(jsonPayload);
    },
    isLoggedIn: function() {
        var token = this.getToken();
        if (token == '') {
            console.log('no token');
            return false;
        }
        var payload = this.parseJwt(token);
        console.log(payload.exp);
        var date = new Date();
        var seconds = Math.round(date.getTime() / 1000);
        console.log(seconds);
        if (payload.exp > seconds) {
            this.token = token;
            console.log("Not expired!");
            return true;
        }
        else {
            console.log("Token expired!");
            return false;
        }
    }
};
