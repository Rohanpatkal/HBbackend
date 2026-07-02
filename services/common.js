import FilteredData from "../dao/filteredData.js";
import FullData from "../dao/fullData.js";

const services = {
    dataBreaker: async function (rowData) {
        let filterdAllData = {
            totalDetails: {},
            data: {}
        };
        let yearData = {
            yearDetails: {
                max: { count: -Infinity, date: "" },
                min: { count: Infinity, date: "" },
            },
            yearlyData: {
                month: { count: 0, month: "", year: "" }
            }
        };

        const fullData = this.dataOparation(rowData, filterdAllData, yearData);
        const fullDatawithDetailsData = this.fullDatawithDetails(filterdAllData);

        // Save to MongoDB
        await this.saveToMongo(filterdAllData, fullDatawithDetailsData);

        return "Data saved to MongoDB successfully";
    },

    saveToMongo: async function (filterdAllData, fullDatawithDetailsData) {
        try {
            // Upsert FilteredData — replace the single stored document each time
            await FilteredData.findOneAndUpdate(
                {}, // match any existing document
                {
                    totalDetails: filterdAllData.totalDetails,
                    data: filterdAllData.data,
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            console.log("FilteredData saved to MongoDB");

            // Split AllDetails out from the year keys for FullData model
            const { AllDetails, ...yearData } = fullDatawithDetailsData;
            await FullData.findOneAndUpdate(
                {},
                { AllDetails, yearData },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            console.log("FullData saved to MongoDB");
        } catch (err) {
            console.error("MongoDB save error:", err.message);
            throw err;
        }
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
                let monthandyear = `${month}-${year}`;
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
        this.totalYearDetails(filterdAllData, yearData); // compute yearly details after all rows are parsed
        return filterdAllData;
    },
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

                const [month, year] = monthKey.split("-");
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
            let yearTotalCount = 0;

            Object.keys(yearDetails).forEach(monthKey => {
                const monthDataArray = yearDetails[monthKey];
                const monthTotalCount = monthDataArray.reduce((sum, dayData) => {
                    return sum + (parseInt(dayData.count, 10) || 0);
                }, 0);

                yearTotalCount += monthTotalCount;

                const [month, year] = monthKey.split("-");
                const monthLabel = `${month}/${year}`;

                //all months one by one data in yearlyData
                //month details in per month
                if (!yearData.yearlyData.month[yearKey]) {
                    yearData.yearlyData.month[yearKey] = {
                        count: monthTotalCount,
                        month: monthLabel,
                        year: yearKey
                    };
                } else {
                    yearData.yearlyData.month[yearKey].count += monthTotalCount;
                }

            });

            if (yearTotalCount > yearData.yearDetails.max.count) {
                yearData.yearDetails.max.count = yearTotalCount;
                yearData.yearDetails.max.date = yearKey;
            }
            if (yearTotalCount < yearData.yearDetails.min.count) {
                yearData.yearDetails.min.count = yearTotalCount;
                yearData.yearDetails.min.date = yearKey;
            }
        });
    },
    fullDatawithDetails: function (filterdAllData) {
        let fullDatawithDetails = {
            AllDetails: {
                count: 0,
                month: "",
                year: ""
            },
        };

        Object.keys(filterdAllData.data).forEach(yearKey => {
            const yearDetails = filterdAllData.data[yearKey];
            let yearTotalCount = 0;

            Object.keys(yearDetails).forEach(monthKey => {
                const monthDataArray = yearDetails[monthKey];
                const monthTotalCount = monthDataArray.reduce((sum, dayData) => {
                    return sum + (parseInt(dayData.count, 10) || 0);
                }, 0);

                yearTotalCount += monthTotalCount;

                const [month, year] = monthKey.split("-");
                const monthLabel = `${month}/${year}`;

                if (!fullDatawithDetails[yearKey]) {
                    fullDatawithDetails[yearKey] = {
                        yearDetails: {
                            max: {
                                count: -Infinity,
                                date: ""
                            },
                            min: {
                                count: Infinity,
                                date: ""
                            },
                        },
                        [monthKey]: {
                            monthDetails: {
                                count: monthTotalCount,
                                month: monthLabel,
                                year: yearKey,
                                totalDayCount: monthDataArray.length
                            },
                            Daydata: monthDataArray
                        }
                    };
                } else {
                    fullDatawithDetails[yearKey][monthKey] = {
                        monthDetails: {
                            count: monthTotalCount,
                            month: monthLabel,
                            year: yearKey,
                            totalDayCount: monthDataArray.length
                        },
                        Daydata: monthDataArray
                    };
                }
            });

            if (yearTotalCount > fullDatawithDetails[yearKey].yearDetails.max.count) {
                fullDatawithDetails[yearKey].yearDetails.max.count = yearTotalCount;
                fullDatawithDetails[yearKey].yearDetails.max.date = yearKey;
            }
            if (yearTotalCount < fullDatawithDetails[yearKey].yearDetails.min.count) {
                fullDatawithDetails[yearKey].yearDetails.min.count = yearTotalCount;
                fullDatawithDetails[yearKey].yearDetails.min.date = yearKey;
            }

            fullDatawithDetails.AllDetails = filterdAllData.totalDetails;
        });

        return fullDatawithDetails;
    },
    filteterdMonthData: function (fullData) {
        let monthData = {};
        Object.keys(fullData.data).forEach(yearKey => {
            const yearDetails = fullData.data[yearKey];
            Object.keys(yearDetails).forEach(monthKey => {
                const monthDataArray = yearDetails[monthKey];
                const monthTotalCount = monthDataArray.reduce((sum, dayData) => {
                    return sum + (parseInt(dayData.count, 10) || 0);
                }, 0);

                const [month, year] = monthKey.split("-");
                const monthLabel = `${month}/${year}`;

                monthData[monthLabel] = monthTotalCount;
            });
        });
        return monthData;
    }
}
export default services