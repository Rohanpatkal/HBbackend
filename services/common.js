import { log } from "console";
import fs from "fs";

const services = {
    dataBreaker: function (rowData) {
        // let monthlyData = {
        //     totalDetails: {},
        //     monthlyData: {}
        // };
        let filterdAllData = {
            totalDetails: {},
            data: {}
        }
        let yearData = {
            yearDetails: {},
            yearlyData: {}
        }
        const fullData = this.dataOparation(rowData, filterdAllData, yearData);
        fs.writeFileSync("filterdAllData.json", JSON.stringify(fullData, null, 2));
        // fs.writeFileSync("TotalData.json", JSON.stringify(filterdAllData, null, 2));
        // fs.writeFileSync("yearlyData.json", JSON.stringify(yearlyData, null, 2));
        return "File written successfully";
    },
    dataOparation: function (rowData, filterdAllData, yearData) {
        const trimedRowData = rowData.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '').trim();
        let totalRowData = trimedRowData.trim().split("-----------------------------------------------------------------------").map(line => line.trim()).filter(line => line.length > 0);

        //month data
        totalRowData.forEach(monthElement => {
            let cleanMonthData = monthElement.trim();

            //day data
            cleanMonthData.split("\n").forEach(dayElement => {
                let dayData = {
                    count: 0,
                    day: "", month: "", year: "",
                    data: []
                };
                const singleDayBreak = dayElement.trim().split(/\s+/);
                const [day, month, year] = singleDayBreak[2].split("/");
                dayData.count = singleDayBreak[0];
                dayData.day = day;
                dayData.month = month;
                dayData.year = year;

                //insert filterdAllData
                let monthandyear = `array-${month}-${year}`;
                if (!filterdAllData.data[year]) {
                    filterdAllData.data[year] = {};
                }
                if (!filterdAllData.data[year][monthandyear]) {
                    filterdAllData.data[year][monthandyear] = [];
                }
                filterdAllData.data[year][monthandyear].push(dayData);
            });
        });
        this.totalDataDetails(filterdAllData); // compute totals after all rows are parsed
        return filterdAllData;
    },
    // totalYearDetails: function (monthData, yearlyData) {

    //     Object.keys(monthData).forEach(monthKey => {
    //         const monthDetails = monthData[monthKey].monthDetails;
    //         const [_, month, year] = monthKey.split("-");
    //     });

    // },
    // totalDataDetails: function (filterdAllData) {
    //     // console.log("monthDatamonthData", dayArray);
    //     console.log("monthDatamonthData", filterdAllData);

        
    //     let totalCount = 0;
    //     dayArray.forEach(day => {
    //         totalCount += parseInt(day.count, 10) || 0;
    //     });

    //     let date = null;
    //     if (dayArray.length > 0 && dayArray[0].month && dayArray[0].year) {
    //         date = `${dayArray[0].month}/${dayArray[0].year}`;

    //         if (!monthlyData.monthlyData[dayArray[0].year]) {
    //             monthlyData.monthlyData[dayArray[0].year] = [];
    //         }

    //         monthlyData.monthlyData[dayArray[0].year].push({
    //             date,
    //             totalCount
    //         });
    //     }

    //     if (!monthlyData.totalDetails.max || monthlyData.totalDetails.max < totalCount) {
    //         monthlyData.totalDetails.max = totalCount;
    //         monthlyData.totalDetails.maxDate = date;
    //     }

    //     if (!monthlyData.totalDetails.min || monthlyData.totalDetails.min > totalCount) {
    //         monthlyData.totalDetails.min = totalCount;
    //         monthlyData.totalDetails.minDate = date;
    //     }

    //     return {
    //         totalCount,
    //         date
    //     };
    // },
    totalDataDetails: function (filterdAllData) {
        let overallTotal = 0;
        let yearMax = -Infinity;
        let yearMin = Infinity;
        let monthMax = -Infinity;
        let monthMin = Infinity;
        let yearMaxKey = null;
        let yearMinKey = null;
        let monthMaxKey = null;
        let monthMinKey = null;

        Object.keys(filterdAllData.data).forEach(yearKey => {
            const yearDetails = filterdAllData.data[yearKey];
            let yearTotalCount = 0;

            Object.keys(yearDetails).forEach(monthKey => {
                const monthDataArray = yearDetails[monthKey];
                const monthTotalCount = monthDataArray.reduce((sum, dayData) => {
                    return sum + (parseInt(dayData.count, 10) || 0);
                }, 0);

                yearTotalCount += monthTotalCount;
                overallTotal += monthTotalCount;

                const [, month, year] = monthKey.split("-");
                const monthLabel = `${month}/${year}`;

                if (monthTotalCount > monthMax) {
                    monthMax = monthTotalCount;
                    monthMaxKey = monthLabel;
                }
                if (monthTotalCount < monthMin) {
                    monthMin = monthTotalCount;
                    monthMinKey = monthLabel;
                }
            });

            if (yearTotalCount > yearMax) {
                yearMax = yearTotalCount;
                yearMaxKey = yearKey;
            }
            if (yearTotalCount < yearMin) {
                yearMin = yearTotalCount;
                yearMinKey = yearKey;
            }
        });

        filterdAllData.totalDetails = {
            totalCount: overallTotal,
            yearMax: {
                year: yearMaxKey,
                count: yearMax
            },
            yearMin: {
                year: yearMinKey,
                count: yearMin
            },
            monthMax: {
                month: monthMaxKey,
                count: monthMax
            },
            monthMin: {
                month: monthMinKey,
                count: monthMin
            }
        };
    },
    totalYearDetails: function (filterdAllData, yearData) {
        Object.keys(filterdAllData.data).forEach(yearKey => {
            const yearDetails = filterdAllData.data[yearKey];
            let totalYearCount = 0;
            Object.keys(yearDetails).forEach(monthKey => {
                const monthDataArray = yearDetails[monthKey];
                monthDataArray.forEach(dayData => {
                    totalYearCount += parseInt(dayData.count, 10) || 0;
                });
            });

            if (!yearData.yearlyData[yearKey]) {
                yearData.yearlyData[yearKey] = {};
            }
            yearData.yearlyData[yearKey].totalCount = totalYearCount;

            if (!yearData.yearDetails.max || yearData.yearDetails.max < totalYearCount) {
                yearData.yearDetails.max = totalYearCount;
                yearData.yearDetails.maxYear = yearKey;
            }

            if (!yearData.yearDetails.min || yearData.yearDetails.min > totalYearCount) {
                yearData.yearDetails.min = totalYearCount;
                yearData.yearDetails.minYear = yearKey;
            }
        });

        return yearData;
    }
}
export default services