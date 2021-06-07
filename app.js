//  Module
var express         = require('express');
var eccrypto        = require("eccrypto");
var crypto          = require("crypto");
var fs              = require('fs');
var app             = express();
var Custummodule    = require('./script/CustumModule');
var CustomEnc       = require('./script/decrypt');
var mysql           = require('mysql');
var bodyParser      = require('body-parser');
var session         = require('express-session');
const { rawListeners } = require('process');
var MySQLStore      = require('express-mysql-session')(session);
var date = new Date();
var Web3            = require('web3');
var web3            = new Web3();
web3.setProvider(new Web3.providers.HttpProvider("http://203.234.19.96:8545"));

//  DBConnect
var MySQLOption = {
    host : 'localhost',
    port : 3306,
    user : 'root',
    password : 'root',
    database : 'book_server'
};

var conn = mysql.createConnection(MySQLOption);
conn.connect();

//  View settings
app.set('views', __dirname + '/source');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(express.static('source'));

//  Use session
var sessionStore = new MySQLStore(MySQLOption); 
app.use(
    session({
        key:"session_cookie_name",
        secret:"session_cookie_secret",
        store: sessionStore,
        resave:true,
        saveUninitialized:true
    })
);


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
    있는것 : 마이페이지, 키등록, 키신청, 뷰어, 회원정보수정, 장바구니, 책보기
    없는것 : 이관신청, 이관받기, 
*/

app.get('/mypage', (req, res)=>{
    var sql = "SELECT distinct * FROM purchase WHERE user_id=?";
    var params = req.session.user_id;
    conn.query(sql, params, function(err, rows, fields){
        res.render('mypage', {'user_id':req.session.user_id, 'rows':JSON.stringify(rows)});
        
    });
})


app.post('/pdfviewer', (req, res)=>{
    var locate = "./source/docs/" + req.body.book_name;
    console.log(req.body.book_name);
    var stream = fs.ReadStream('./source/docs/'+req.body.book_name + ".pdf");//뒤에 책이름 추가.
    filename=encodeURIComponent("capstone.pdf");
    res.setHeader('Content-disposition', 'inlinel filename="'+filename+'"');
    res.setHeader('Content-type','application/pdf');
    stream.pipe(res);
});

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
    있는것 : 책찾기, 책필드, 장바구니, 책구매
    없는것 :  
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

app.get('/purchase', function(req, res){
    var sql2 = 'SELECT * FROM book WHERE book_name=?'
    var query2 = req.query.book_name;
    conn.query(sql2, query2, function(err,rows,fields){
        var time = new Date();
        var sql = 'INSERT INTO purchase(user_id, book_name, purchase_date, book_img, book_isbn)VALUES(?,?,?,?,?)';
        var query = [req.session.user_id, rows[0].book_name, time, rows[0].book_img,rows[0].book_isbn];
        console.log(query);
        conn.query(sql, query, function(err,rows,fields){
            if(err) console.log(err);
            else console.log(rows);
        });
        res.render("confirmation", {
        'user_id':req.session.user_id
        , 'book_name':rows[0].book_name
        , 'book_isbn':rows[0].book_isbn
        , 'book_auth':rows[0].book_auth
        , 'book_price':rows[0].book_price
        , 'time':time});
    });
})
app.get('/cart', function(req, res){
    var sql2 = 'SELECT * FROM book WHERE book_name=?'
    var query2 = req.query.book_name;
    conn.query(sql2, query2, function(err,rows,fields){
        var time = new Date();
        var sql = 'INSERT INTO cart(book_name, book_price, book_img, user_id)VALUES(?,?,?,?)';
        var query = [rows[0].book_name, rows[0].book_price, rows[0].book_img, req.session.user_id];
        console.log(query);
        conn.query(sql, query, function(err,rows,fields){
            if(err) console.log(err);
            else console.log(rows);
        });
        res.render("cart", {
        'user_id':req.session.user_id
        , 'book_name':rows[0].book_name
        , 'book_isbn':rows[0].book_isbn
        , 'book_auth':rows[0].book_auth
        , 'book_price':rows[0].book_price
        , 'time':time});
    });
})

app.get('/tcart', function(req, res){
    var sql2 = 'SELECT * FROM book WHERE book_name=?'
    var query2 = req.query.book_name;
    conn.query(sql2, query2, function(err,rows,fields){
        var time = new Date();
        var sql = 'INSERT INTO tcart(book_name, book_price, book_img, user_id)VALUES(?,?,?,?)';
        var query = [rows[0].book_name, rows[0].book_price, rows[0].book_img, req.session.user_id];
        console.log(query);
        conn.query(sql, query, function(err,rows,fields){
            if(err) console.log(err);
            else console.log(rows);
        });
        res.render("tcart", {
        'user_id':req.session.user_id
        , 'book_name':rows[0].book_name
        , 'book_isbn':rows[0].book_isbn
        , 'book_auth':rows[0].book_auth
        , 'book_price':rows[0].book_price
        , 'time':time});
    });
})

app.get('/mycart', function(req, res){
    var sql = 'SELECT * FROM cart WHERE user_id=?';
    var query = req.session.user_id;
    conn.query(sql, query, function(err, rows, fields){
        console.log(rows);
        res.render('mycart', {'user_id':req.session.user_id, "rows":JSON.stringify(rows)});
    })
})


// 추가할 코드(테스트중)

// [ 실질적으로 블록체인 네트워크에 데이터 가져오는 곳]
app.get('/mytcart', function(req, res){
    var sql = 'SELECT * FROM tcart WHERE user_id=?';
    var query = req.session.user_id;
    conn.query(sql, query, function(err, rows, fields){
        console.log(rows);
        res.render('mycart', {'user_id':req.session.user_id, "rows":JSON.stringify(rows)});
    })
})

app.post('/mytcart', function(req, res){

});

app.get('/sendtransfer', function(req, res){
    var sql = "SELECT distinct * FROM purchase WHERE user_id=?";
    var params = req.session.user_id;
    conn.query(sql, params, function(err, rows, fields){
        res.render('sendtransfer', {'user_id':req.session.user_id, 'rows':JSON.stringify(rows)});
    });
});

// [ 실질적으로 블록체인 네트워크에 데이터 올리는 곳]
app.post('/sendtransfer', function(req, res){
    var book_name = req.body.book_name;
    var sql = "SELECT * FROM book WHERE book_name = ?"
    for(var i = 0; i < 1; i++){
        var query = req.body.book_name;
        conn.query(sql, query, function(err, rows, fields){
        	console.log(rows[0].book_isbn);
        	sendTx(rows[0].book_isbn);
        });
    }
   /* var sql2 = "DELETE FROM purchase WHERE book_name = ?  and user_id=?"
    for(i = 0; i < 1; i++){
        var query2 = [req.body.book_name, req.session.user_id]; 
        conn.query(sql2, query2, function(err, rows, fields){
        });
    }*/
    res.render("successTransfer");
});


// Start
app.listen(3000, ()=>{

});

// [ TEST ( instert book )]
app.get('/insertBook', function(req,res){
    var sql = 'INSERT INTO book(book_name,Author,ISBN,Price, BookImg)VALUES(?,?,?,?,?)';
    var query = ["어린왕자","앙투안 드 생텍쥐페리","9791159039690",9500, '0x00'];
    conn.query(sql, query, function(err,rows,fields){
        if(err) console.log(err);
        else console.log(rows);
    })
    res.end();
});



/* Block Chain */

async function makeData(MSG,purTran){
    console.log(".Do Sign MSG:", MSG);
    const bookData = await CustomEnc.ecdsaSign(MSG);
    var BookData = JSON.stringify(bookData);
    var PlatfromIndex = '02';   //고정

    Str_data = BookData+PlatfromIndex+purTran;
    var ABI_data = web3.eth.abi.encodeParameter('string',Str_data);
    return ABI_data;
}

async function sendTx(isbn,purTran){
    var toAddress = '0xa74d2A27407e64405Fb5715d628323EB0eFf0fbC';
    var myAddress = '0x631b9463ce44D84d2C1219981c418225F7Da929C';
	
    var dataStr = await makeData(isbn, purTran);
    	//console.log("2",dataStr)
    web3.eth.sendTransaction({
        from: myAddress,
        to: toAddress,
        data: dataStr
        }
    );
   console.log('hello')
    
}

sendTx("5132","00");

//Test하는중...

function toHex(arr){
    var hexArr="";

    for(var i=0; i<arr.length; i++){
        var data = arr[i].toString(16)
        if(data.length!=2){
            data = '0'+data
        }
        hexArr+=(data);
    }
    return hexArr;
}

async function getTx(ISBNstr){
    var BLOCK = await web3.eth.getBlock(34,true);
    var TxData = BLOCK.transactions[0].input;
    let StrData = web3.eth.abi.decodeParameter('string',TxData);
    let PurTranData = StrData.substr(StrData.length-2,2)

    if(PurTranData=="00"){
        let BookData = StrData.substr(0,StrData.length-4)

        const ObjBookData = JSON.parse(BookData)
        var data = ObjBookData.data;
        buffData=Buffer.from(toHex(data),'hex')

        var sigTest = await CustomEnc.ecdsaVerify(ISBNstr,buffData)
        console.log(sigTest)
    }

}
getTx("5132");
                                                                                                                                                                                           
