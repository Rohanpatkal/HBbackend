import fs from "fs";

const services = {
    dataBreaker: function (rowData) {
        //freshly devide into month data
        // "-----------------------------------------------------------------------"
        //remove unessory comments from rowData
        // console.log("rowDatarowData",rowData);
        
        let lines = rowData.split("-----------------------------------------------------------------------");
        console.log("lineslineslines",lines);
        
        return "hello world";
    },
    monthBreaker: function (data) {
        return data;
    }
}
export default services
