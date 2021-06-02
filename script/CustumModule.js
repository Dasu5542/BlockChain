function hexToString(hex){
    var str = "";
    var i=0
    for(i=0;i<32;i++){
        if(hex[i]/16 >= 10) str += String.fromCharCode(hex[i]/16 +87)
        else str += String.fromCharCode(hex[i]/16 +48)
        if(hex[i]%16 >= 10) str += String.fromCharCode(hex[i]%16 +87)
        else str += String.fromCharCode(hex[i]%16 +48)
    }
    console.log(hex);
    return str;
}

module.exports.hexToString = hexToString;