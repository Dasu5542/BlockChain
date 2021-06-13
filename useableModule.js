
/*
    [ main page ]
    있는것 : 메인페이지
    없는것 :
*/


app.get('/', (req, res)=>{
    res.render("index");
});


/*
    [ Login ]
    있는것 : 로그인, 회원가입 
    없는것 :
*/
app.get('/login', (req, res)=>{
    if(req.session.isLogined){
        console.log("################### " + req.session.isLogined);
        res.redirect("/mypage");
    }
    else res.render("login");
});

app.post('/login', function(req,res){
    var sql = 'SELECT * FROM user WHERE user_id=? and user_pw=?';
    var params = [req.body.user_id, req.body.user_pw]
    console.log(req.body.user_id+ " " +  req.body.user_pw);
    conn.query(sql, params, function(err,rows,fields){
        if(err){
            console.log(err);
            res.redirect("/login");
        }
        else if(rows[0] == null){
            console.log(rows[0]);
            console.log("error");
            res.redirect("/login");
        }
        else{
            req.session.user_id = rows[0].user_id;
            req.session.isLogined = true;
            req.session.save(()=>{
                res.redirect("/");
            });
        }
    })
});

app.get('/register', function(req,res){
    res.render('register');
});

app.post('/register', function(req,res){
    var sql = 'INSERT INTO user(user_id,user_pw,user_name,user_phone,user_email,user_publickey)VALUES(?,?,?,?,?,?)';
    console.log(req.body);
    var params = [req.body.user_id,
        req.body.user_pw,
        req.body.user_name,
        req.body.user_phone,
        req.body.user_email,''];
    conn.query(sql, params, function(err, rows, fields){
        if(err) console.log(err);
        else console.log(rows.insertID);
    });
    res.redirect('/login');
});


/*
    [ mypage ]
    있는것 : 마이페이지, 키등록, 키신청, 뷰어, 회원정보수정
    없는것 : 이관신청, 이관받기, 장바구니, 책보기
*/


app.get('/mypage', (req, res)=>{
    console.log("hi???? " + req.session.user_id);
    res.render('mypage', {'user_id':req.session.user_id});
})

app.get('/revise', function(req, res){
    var sql = 'SELECT * FROM user WHERE user_id=?';
    var params = req.session.user_id;
    conn.query(sql, params, function(err, rows, fields){
        res.render("revise", 
        {'user_id':rows[0].user_id,
        'user_pw':rows[0].user_pw,
        'user_phone':rows[0].user_phone,
        'user_name':rows[0].user_name,
        'user_email':rows[0].user_email});
    })
});

app.post('/revise', function(req, res){
    var sql = 'UPDATE user SET user_pw=?, user_name=?, user_email=?, user_phone=? WHERE user_id=?';
    var params = [req.body.user_pw, req.body.user_name, req.body.user_email, req.body.user_phone ,req.session.user_id];
    conn.query(sql, params, function(err, rows, fields){
        if(err){
            console.log(err);
            res.render("revise");
        }
        else{
            console.log(rows);
            res.redirect("/mypage");
        }
    })
});

app.get('/key', (req, res)=>{
    res.render('howtogetkey', {'user_id':req.session.user_id});
});

app.get('/applykey', (req,res)=>{
    res.render('applykey', {'user_id':req.session.user_id})
});

app.post('/applykey', (req,res)=>{
    var sql = 'UPDATE user SET user_publickey=? WHERE user_id=?';
    var key = req.body.user_publickey;
    var params=[key, req.session.user_id];
    if(key.length != 64){
        res.render("failPage", {'user_id':req.session.user_id});
    }
    else{
        conn.query(sql, params, (err, rows, fields)=>{
            if(err) throw err;
            console.log("success");
            res.render("successPage", {'user_id':req.session.user_id});
        })
    }

});
app.get('/createkey', function(req, res){
    if(req.session.displayName){
        console.log(req.session.displayName);
    } 
    var priv = eccrypto.generatePrivate();
    var pub  = eccrypto.getPublic(priv);
    var strPriv = Custummodule.hexToString(priv);
    var sql = 'UPDATE user SET user_publickey=? WHERE user_id=?';
    var params = [Custummodule.hexToString(pub), req.session.user_id]
    console.log(pub + ' ' + req.session.user_id);
    conn.query(sql, params, function(err, rows, fields){
        console.log(priv);
        res.render( 'createkey', {'priv':strPriv, 'user_id':req.session.user_id});
    })
})

/*
    [ Book ]
    있는것 : 책찾기, 책필드
    없는것 : 책구매, 장바구니담기
*/

app.post('/Search', function(req, res){
    var sql = 'SELECT * FROM book WHERE book_name LIKE ?'
    var params = "%" + req.body.book_name + "%";
    console.log(params);
    conn.query(sql, params,function(err,rows,fields){
        console.log(rows);
        res.render('shop', {"rows":JSON.stringify(rows)});
    });
});

app.get('/book', function(req,res){
    var sql = 'SELECT * FROM book WHERE book_name=?'
    var params = req.query.book_name;
    conn.query(sql, params, function(err, rows, fields){
        console.log(rows);
        res.render('book', {"rows":JSON.stringify(rows)});
    })
})