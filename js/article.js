var article = {
    apiServer: API_URL + ':' + API_PORT,
    token: '',
    listContainerId: 'articles-list',
    addButtonContainerId: 'add-button-container',
    loggedIn: false,
    addButtonTemplate: `
        <div class="btn-group">
            <button class="btn btn-outline-success btn-sm mx-1" type="button" id="add-button">Add Article</button>
        </div>        
    `.trim(),
    formTemplate: `
        <!-- Modal -->
        <div class="modal fade" id="article-form" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add/Edit Teddy Bear</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <input type="hidden" id="article-id-input" value="" />
                            <input type="text" class="form-control" id="article-title-input" placeholder="Title" required>
                            <textarea class="form-control my-1" id="article-summary-input" rows="3" placeholder="Summary" required></textarea>
                            <div class="input-group mb-2 mr-sm-2">
                                <div class="input-group-prepend">
                                    <div class="input-group-text">€</div>
                                </div>
                                <input type="text" class="form-control" id="article-price-input" placeholder="Price" required>
                            </div>
                            <div class="input-group mb-3">
                                <label class="input-group-text" for="image-input">Upload Image</label>
                                <input type="file" class="form-control" id="image-input">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" id="save-button">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `.trim(),
    init: function () {
        document.addEventListener('logged-in', evt => {
            console.log('received logged in event');
            this.loggedIn = true;
            this.token = evt.detail;
            this.showList();
        });
        document.addEventListener('logged-out', evt => {
            console.log('received logged out event');
            this.loggedIn = false;
            this.token = '';
            this.showList();
        });
        this.showList();
    },
    render: function (articles) {
        var articlesBlock = '';
        var articlesIds = [];

        if (this.loggedIn) {
            document.getElementById(this.addButtonContainerId).innerHTML = this.addButtonTemplate;
        } else {
            document.getElementById(this.addButtonContainerId).innerHTML = '';
        }

        articles.forEach(article => {
            articlesIds.push(article.id);
            let articleAdminButtons = `
                <button class="btn btn-warning btn-sm float-end" type="button" id="edit-${article.id}">Edit</button>
                <button class="btn btn-danger btn-sm mx-2 float-end" type="button" id="delete-${article.id}">Delete</button>`.trim();
            
            let articleItem = `
                <div class="card-deck mb-3 text-left">
                    <div class="card mb-4 box-shadow">
                        <img class="card-img-top" src="${this.apiServer}/${article.photo}" alt="Teddy bear">
                        <div class="card-body">
                            <h3 class="card-title pricing-card-title">${article.title}</h3>
                            <h6 class="card-subtitle mb-2 text-muted">Price: ${article.price} €</h6>
                            <p class="card-text">${article.summary}</p>
                            <button class="btn btn-link" type="button" data-bs-toggle="collapse" data-bs-target="#item-order-${article.id}">Order now!</button>
                            ${this.loggedIn ? articleAdminButtons : ''}
                            <div class="collapse" id="item-order-${article.id}">
                                <form id="form-${article.id}">
                                    <div class="form-group">
                                        <small class="form-text text-muted">Enter your shipping details.</small>
                                        <input type="email" class="form-control" id="email-${article.id}" placeholder="Email">
                                        <input type="text" class="form-control my-1" id="full-name-${article.id}" placeholder="Full name" required>
                                        <input type="text" class="form-control" id="address-${article.id}" placeholder="Address" required>
                                    </div>
                                    <button type="submit" class="btn btn-success" id="buy-${article.id}">Buy</button>
                                </form>
                                <div class="alert alert-success d-none" id="alert-${article.id}" role="alert">
                                    Thank you for your order!
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`.trim();

            articlesBlock += articleItem;
        });

        document.getElementById(this.listContainerId).innerHTML = articlesBlock;
        if (this.loggedIn) {
            document.getElementById('add-button').addEventListener('click', evt => {
                this.showAddForm();
            });
        }
        articlesIds.forEach(id => {
            document.getElementById('form-' + id).addEventListener('submit', evt => {
                evt.preventDefault();
                this.buy(id);
                return false;
            });
            if (this.loggedIn) {
                document.getElementById('edit-' + id).addEventListener('click', evt => {
                    this.showEditForm(id);
                });
                document.getElementById('delete-' + id).addEventListener('click', evt => {
                    this.delete(id);
                });
            }
        });
    },
    showList: function() {
        fetch(this.apiServer + "/articles")
            .then(response => response.json())
            .then(articles => {
                console.log(articles);
                this.render(articles);
        });
    },
    buy: function (id) {
        console.log('buy: ', id);
        var fullName = document.getElementById('full-name-' + id).value;
        var address = document.getElementById('address-' + id).value;
        var email = document.getElementById('email-' + id).value;
        var buyAlert = document.getElementById('alert-' + id);

        fetch(this.apiServer + '/customer/buy/' + id, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: fullName,
                                        address: address,
                                        email: email })
        })
        .then(response => {
            if (response.ok) 
                response.json().then(data => {
                    buyAlert.classList.add('alert-success');
                    buyAlert.classList.remove('d-none', 'alert-danger');
                });
            else {
                response.json().then(data => {
                    buyAlert.classList.add('alert-danger');
                    buyAlert.classList.remove('d-none', 'alert-success');
                    buyAlert.textContent = data.message;
                });
            }
        });
    },
    showAddForm: function () {
        console.log('add article');
        document.getElementById('article-form-container').innerHTML = this.formTemplate;

        var articleForm = new bootstrap.Modal(document.getElementById('article-form'), {
            keyboard: false,
            backdrop: 'static'
        });
        articleForm.show();

        document.getElementById('save-button').addEventListener('click', this.save.bind(this));

        document.getElementById('article-form').addEventListener('hidden.bs.modal', evt => {
            console.log('modal hidden');
            document.getElementById('article-form-container').innerHTML = '';
        });
    },
    showEditForm: function (id) {
        console.log('edit id: ', id);

        fetch(this.apiServer + "/article/" + id)
            .then(response => response.json())
            .then(article => {
                console.log(article);
                document.getElementById('article-form-container').innerHTML = this.formTemplate;
                document.getElementById('article-id-input').value = id;
                document.getElementById('article-title-input').value = article.title;
                document.getElementById('article-summary-input').value = article.summary;
                document.getElementById('article-price-input').value = article.price;

                var articleForm = new bootstrap.Modal(document.getElementById('article-form'), {
                    keyboard: false,
                    backdrop: 'static'
                });
                articleForm.show();

                document.getElementById('save-button').addEventListener('click', this.save.bind(this));
            
                document.getElementById('article-form').addEventListener('hidden.bs.modal', evt => {
                    console.log('modal hidden');
                    document.getElementById('article-form-container').innerHTML = '';
                });
        });
    },
    delete: function (id) {
        console.log('delete id: ', id);
        fetch(this.apiServer + '/article/' + id, { 
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer: ' + this.token
            }
        })
        .then(response => {
            if (response.ok) {
                alert('Article deleted!');
                this.showList();
            } else {
                response.json().then(data => {
                    alert(data.message);
                });
            }
        });
    },
    save: function () {
        console.log('save');
        let articleId = document.getElementById('article-id-input').value.trim();
        let articleTitle = document.getElementById('article-title-input').value.trim(); 
        let articleSummary = document.getElementById('article-summary-input').value.trim();
        let articlePrice = document.getElementById('article-price-input').value.trim();
        let img = document.getElementById('image-input');

        var form = new FormData();
        console.log(img);
        if (img.files.length > 0 ) {
            // add img to FormData
            console.log("adding image");
            form.append('article_photo', img.files[0]);
            console.log(img.files[0].name, img.files[0].size, img.files[0].type);
        }

        form.append('title', articleTitle);
        form.append('summary', articleSummary);
        form.append('price', articlePrice);


        if (articleId != "") {
            fetch(this.apiServer + '/article/' + articleId, { 
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer: ' + this.token
                },
                body: form
            })
            .then(response => {
                if (response.ok) {
                    alert('Article edit saved!');
                    
                    //bootstrap.Modal.getInstance(document.getElementById('article-form')).hide();
                    this.showList();
                } else {
                    response.json().then(data => {
                        alert(data.message);
                    });
                }
            });
        } else {
            fetch(this.apiServer + '/article', { 
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer: ' + this.token
                },
                body: form
            })
            .then(response => {
                if (response.ok)  {
                    alert('New article added!');
                    setTimeout(
                    bootstrap.Modal.getInstance(document.getElementById('article-form')).hide(), 1000)
                    this.showList();
                } else {
                    response.json().then(data => {
                        alert(data.message);
                    });
                }
            });
        }
        
        console.log(articleId, articleTitle, articleSummary, articlePrice);
    }
};