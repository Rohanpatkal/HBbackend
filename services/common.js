import { log } from "console";
import fs from "fs";

const services = {
    dataBreaker: function (rowData) {

        const monthData = this.dataOparation(rowData);
        fs.writeFileSync("data.json", JSON.stringify(monthData, null, 2));
        return "File written successfully";
    },
    dataOparation: function (rowData) {
        const monthData = {};

        const trimedRowData = rowData.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '').trim();
        let yearRowData = trimedRowData.trim().split("-----------------------------------------------------------------------").map(line => line.trim()).filter(line => line.length > 0);

        yearRowData.forEach(monthElement => {
            let cleanMonthData = monthElement.trim();
            let monthandyear = "";
            cleanMonthData.split("\n").forEach(dayElement => {
                let dayData = {
                    count: 0,
                    day: "", month: "", year: "",
                    data: []
                };
                const singleDayBreak = dayElement.trim().split(/\s+/);
                dayData.count = singleDayBreak[0];
                const [day, month, year] = singleDayBreak[2].split("/");
                dayData.day = day;
                dayData.month = month;
                dayData.year = year;
                monthandyear = `array-${month}-${year}`;
                if (!monthData[monthandyear]) {
                    monthData[monthandyear] = {
                        monthDetails: {},
                        dayArray: []
                    };
                }
                monthData[monthandyear].dayArray.push(dayData);
            })
            if (monthData[monthandyear]) {

                console.log("aaaaaaaaaaaaaaaa",monthData[monthandyear]);
            }
            // let a = this.totalMonthDetails(monthData[monthandyear].dayArray);
        
            // monthData[monthandyear].monthDetails = {};
        });
        return monthData;
    },
    totalMonthDetails: function (monthData) {
        console.log("monthDatamonthData",monthData);
        
        for (const monthKey in monthData) {
            if (monthData.hasOwnProperty(monthKey)) {
                const monthDetails = monthData[monthKey].monthDetails;
                const dayArray = monthData[monthKey].dayArray;

                let totalCount = 0;
                dayArray.forEach(day => {
                    totalCount += parseInt(day.count, 10);
                });

                monthDetails.totalCount = totalCount;
            }
        }
        return monthData;
    }
}
export default services