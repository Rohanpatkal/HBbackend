import { log } from "console";
import fs from "fs";

const services = {
    dataBreaker: function (rowData) {
        let monthlyData = {
            totalDetails: {},
            monthlyData: {}
        };
        let yearData = {
            yearDetails: {},
            yearlyData: {}
        }
        const fullData = this.dataOparation(rowData, monthlyData, yearData);
        fs.writeFileSync("monthlyData.json", JSON.stringify(fullData, null, 2));
        fs.writeFileSync("TotalData.json", JSON.stringify(monthlyData, null, 2));
        fs.writeFileSync("yearlyData.json", JSON.stringify(yearlyData, null, 2));
        return "File written successfully";
    },
    dataOparation: function (rowData, monthlyData, yearlyData) {
        const monthData = {};

        const trimedRowData = rowData.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '').trim();
        let totalRowData = trimedRowData.trim().split("-----------------------------------------------------------------------").map(line => line.trim()).filter(line => line.length > 0);

        totalRowData.forEach(monthElement => {
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

                console.log("aaaaaaaaaaaaaaaa", monthData[monthandyear]);
            }
            let monthCalculatedDetails = this.totalDataDetails(monthData[monthandyear].dayArray, monthlyData);
            let yearCalculatedDetails = this.totalYearDetails(monthData , yearData);
            monthData[monthandyear].monthDetails = monthCalculatedDetails;
        });
        return monthData;
    },
    totalYearDetails: function (monthData, yearlyData) {

        Object.keys(monthData).forEach(monthKey => {
            const monthDetails = monthData[monthKey].monthDetails;
            const [_, month, year] = monthKey.split("-");
        });

    },
    totalDataDetails: function (dayArray, monthlyData) {
        console.log("monthDatamonthData", dayArray);

        let totalCount = 0;
        dayArray.forEach(day => {
            totalCount += parseInt(day.count, 10) || 0;
        });

        let date = null;
        if (dayArray.length > 0 && dayArray[0].month && dayArray[0].year) {
            date = `${dayArray[0].month}/${dayArray[0].year}`;

            if (!monthlyData.monthlyData[dayArray[0].year]) {
                monthlyData.monthlyData[dayArray[0].year] = [];
            }

            monthlyData.monthlyData[dayArray[0].year].push({
                date,
                totalCount
            });
        }

        if (!monthlyData.totalDetails.max || monthlyData.totalDetails.max < totalCount) {
            monthlyData.totalDetails.max = totalCount;
            monthlyData.totalDetails.maxDate = date;
        }

        if (!monthlyData.totalDetails.min || monthlyData.totalDetails.min > totalCount) {
            monthlyData.totalDetails.min = totalCount;
            monthlyData.totalDetails.minDate = date;
        }

        return {
            totalCount,
            date
        };
    }
}
export default services