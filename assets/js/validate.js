function check_email(str) {
    var reg = /^\w+([-+.]\w+)*@\w+([-.]\\w+)*\.\w+([-.]\w+)*$/
    return reg.test(str);
}

function check_idcard(str) {
    var reg = /^[1-9]([0-9]{14}|[0-9]{17})$/
    return reg.test(str);
}

function check_idcard(str) {
    var reg = /^[1-9]([0-9]{14}|[0-9]{17})$/
    return reg.test(str);
}

function check_password(str) {
    return str.length > 7;
}

function check_phone(str) {
    var reg = /^1\d{10}$/
    return reg.test(str);
}