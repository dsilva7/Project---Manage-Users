class UserController {

    constructor(formIdCreate, formIdUpdate, tableId){

        this.formEl = document.getElementById(formIdCreate);
        this.formUpdateEl = document.getElementById(formIdUpdate);
        this.tableEl = document.getElementById(tableId);
        this.onSubmit();
        this.onEdit();
        this.selectAll();

    }
    //method used for edit users.
    onEdit(){

        document.querySelector('#box-user-update .btn-cancel').addEventListener('click', e=>{

            this.showCreateForm();

        });

        this.formUpdateEl.addEventListener("submit", event=>{

            event.preventDefault();

            //passing of variable the button submit for btn,so we disable the button to avoid duplication 
             let btn = this.formUpdateEl.querySelector("[type=submit]");

            //disabled btn
             btn.disabled = true;

            //passing values for variable
            let values = this.getValues(this.formUpdateEl);

            let index = this.formUpdateEl.dataset.trIndex;

            let tr = this.tableEl.rows[index];

            let userOld = JSON.parse(tr.dataset.user);

            let result = Object.assign({}, userOld, values);
       
            
            

            this.getPhoto(this.formUpdateEl).then((content)=>{

                if(!values.photo) {
                    result._photo = userOld._photo;
                }else {
                    result._photo = content;
                }

                let user = new User();

                user.loadFromJSON(result);

                user.save();

                this.getTr(user, tr);

                this.updateCount();

                this.formUpdateEl.reset();

                this.showCreateForm();

                btn.disabled = false;
    

            }, (e)=>{
                console.error(e);

            });

        });        


    }

    //method of event in button "submit".
    onSubmit(){

        this.formEl.addEventListener("submit", event => {
            //prevent page refresh
            event.preventDefault();

            //passing of variable the button submit for btn,so we disable the button to avoid duplication 
            let btn = this.formEl.querySelector("[type=submit]");

            //disabled btn
            btn.disabled = true;

            //passing values for variable
            let values = this.getValues(this.formEl);  

            if(!values) return false;

            //treating the promise
            this.getPhoto(this.formEl).then((content)=>{

                values.photo = content;
               
                values.save();

                this.addLine(values);

                this.formEl.reset();

                btn.disabled = false;


            }, (e)=>{
                console.error(e);

            }); 
        
        });

    }

    //method used promise and fileReader for captur URL of photo.
    //this method also adds a default photo if none is selected when creating.
    getPhoto(formEl){

        return new Promise((resolve, reject)=>{

            let fileReader = new FileReader(); 
    
            let elements = [...formEl.elements].filter(item =>{

        if (item.name === 'photo') {
             return item;
        }

    });

    let file = elements[0].files[0];

    fileReader.onload = () =>{

        resolve(fileReader.result);

    };

    fileReader.onerror = (e) => {

        reject(e);

    };

   if(file){

    fileReader.readAsDataURL(file);

   } else {

       resolve('dist/img/boxed-bg.jpg');

   }

        });

}

    //method used for captur values in form and valid if it was entered in the required fields
    getValues(formEl){
        
       let user = {};
       let isValid = true;

            [...formEl.elements].forEach(function(field, index){
        
                if (['name', 'email', 'password'].indexOf(field.name) > -1 && !field.value){

                    field.parentElement.classList.add("has-error");
                    isValid = false;

                }


                if(field.name === "gender"){
        
                    if(field.checked){
        
                        user[field.name] = field.value;
                        

                    }     
        
            } else if (field.name == "admin"){
        
                user[field.name] = field.checked;
        
            } else {

                user[field.name] = field.value;

            }

            
            
        });

        if (!isValid){

            return false;

        }
            
             return new User(
                user.name, 
                user.gender, 
                user.birth, 
                user.country, 
                user.email, 
                user.password, 
                user.photo, 
                user.admin
            );
  

    }

    //method used for select all user in localStorage and add in screen.
    selectAll(){

        let users = User.getUsersStorage();
        
        users.forEach(dataUser=>{

        let user = new User();

        user.loadFromJSON(dataUser);

        this.addLine(user);            

        });


    }

    //method used for create the new user.
    addLine(dataUser){
           
        let tr = this.getTr(dataUser);
         
        this.tableEl.appendChild(tr);

        this.updateCount();
    
    }

    //method used for captur "<tr>" and view in screen or create a new "<tr>".
    getTr(dataUser, tr = null){

        if(tr === null) tr = document.createElement('tr');
        
        tr.dataset.user = JSON.stringify(dataUser); 

        tr.innerHTML = 
        `
                    <td><img src="${dataUser.photo}" alt="User Image" class="img-circle img-sm"></td>
                    <td>${dataUser.name}</td>
                    <td>${dataUser.email}</td>
                    <td>${(dataUser.admin) ? 'Sim' : 'Não'}</td>
                    <td>${Utils.dateFormat(dataUser.register)}</td>
                    <td>
                      <button type="button" class="btn btn-primary btn-edit btn-xs btn-flat">Editar</button>
                      <button type="button" class="btn btn-danger btn-delete btn-xs btn-flat">Excluir</button>
                    </td>      
        `;

        this.addEventsTr(tr);

        return tr;

    }

    //method used to add events to buttons on the form.
    addEventsTr(tr){

        tr.querySelector(".btn-delete").addEventListener('click', e=>{

            if(confirm("Deseja realmente excluir esse usuário?")){

                let user = new User();

                user.loadFromJSON(JSON.parse(tr.dataset.user));

                user.remove();

                tr.remove();

                this.updateCount();

            }

        });

        tr.querySelector(".btn-edit").addEventListener('click', e=>{

            let json = JSON.parse(tr.dataset.user);
            let form = document.querySelector('#form-user-update');

            this.formUpdateEl.dataset.trIndex = tr.sectionRowIndex;

            for (let name in json){

                let field = this.formUpdateEl.querySelector("[name="+ name.replace("_", "") + "]");

                if(field){

                    switch(field.type){

                        case 'file':
                        continue;
                        break;

                        case 'radio':
                            field = form.querySelector("[name="+ name.replace("_", "") + "][value=" + json[name] + "]");
                            field.checked = true;
                        break;

                        case 'checkbox':
                            field.checked = json[name];
                            break;

                         default:
                            field.value = json[name];

                    }

                    
                }

                

            }

            this.formUpdateEl.querySelector(".photo").src = json._photo;

            this.showUpdateForm();
           

        });

    }

    //method used for to count created users.
    updateCount(){

        let numberUser = 0;
        let numberAdmin = 0;

        [...this.tableEl.children].forEach(tr=>{

            numberUser++;

            let user = JSON.parse(tr.dataset.user);

            if(user._admin) numberAdmin++;
            

        });

        document.querySelector("#number-users").innerHTML = numberUser;
        document.querySelector("#number-users-admins").innerHTML = numberAdmin;

    }

    //method used for show form create users.
    showCreateForm(){

        document.querySelector('#box-user-create').style.display = 'block';
        document.querySelector('#box-user-update').style.display = 'none';

    }

    //method used for show edit users.
    showUpdateForm(){

        document.querySelector('#box-user-create').style.display = 'none';
        document.querySelector('#box-user-update').style.display = 'block';

    }

}

