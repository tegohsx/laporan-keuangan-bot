function insert_value(data, sheet) {

    let row_val = data,
        row_ins = [],
        id = uniqueID(),
        result,
        message,
        success

    row_ins = [id];

    row_val.forEach((v) => {
        row_ins.push(v)
    });

    sheet.appendRow(row_ins);
    message = "insertion successful";
    success = true

    result = {
        "result": {
            success,
            message,
            id
        }
    };

    return result

}

function uniqueID() {
    return Number(String(new Date().getTime()) + Math.floor(Math.random() * (99 - 10 + 1) + 10)).toString(16);
}