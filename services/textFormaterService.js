const textFormaterService = (textData) => {
    const trimedRowData = textData
        .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "")
        .trim();

    const totalRowData = trimedRowData
        .split("-----------------------------------------------------------------------")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    const formattedData = {};

    totalRowData.forEach((monthElement) => {
        const cleanMonthData = monthElement.trim();

        cleanMonthData.split("\n").forEach((dayElement) => {
            const singleDayBreak = dayElement.trim().split(/\s+/);

            if (singleDayBreak.length < 3) return;

            const [day, month, year] = singleDayBreak[2].split("/");
            const count = Number(singleDayBreak[0]);

            const monthKey = month.padStart(2, "0");
            const dateKey = `${year}-${monthKey}-${day.padStart(2, "0")}`;

            // Create Year
            if (!formattedData[year]) {
                formattedData[year] = {};
            }

            // Create Month
            if (!formattedData[year][monthKey]) {
                formattedData[year][monthKey] = {};
            }

            // Create Day
            formattedData[year][monthKey][dateKey] = {
                date: dateKey,
                count,
                breakCount: 0,
                mood: null,
                notes: "",
                sessions: []
            };
        });
    });

    return formattedData;
};

export default textFormaterService;