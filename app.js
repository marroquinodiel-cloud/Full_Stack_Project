const express = require("express");
const app = express();
const PORT = 3000;
app.use(express.json());

app.use(express.static(__dirname));

const requiredMajorCourses = [
    "Computers & Programming I",
    "Computers & Programming II",
    "Computer Organization",
    "Programming Language Concepts",
    "Intensive Programming in Linux",
    "Principles of Operating Systems",
    "Data Structure & Algorithm Design",
    "Advanced Data Structures & Algorithm Design",
    "Software Engineering",
    "Computer Science Project",
    "Calculus I",
    "Calculus II",
    "Calculus III",
    "Discrete Structures",
    "Probability & Statistics",
    "Numerical Analysis or Numerical Algorithms"
]

const generalEducation = {
    "Basic Writing Skills": 6,
    "Quantitative Reasoning": 3,
    "Natural Sciences": 8,
    "Social Sciences": 6,
    "History and Literature": 9,
    "Arts and Media": 3,
    "Other Liberal Arts": 3
}

const electiveCredits = 9;

app.post("/grad-tracker", (req, res) => {
    const completedMajorCourses = req.body.completedMajor || [];
    const completedGenEdCredits = req.body.genEdCredits || {};
    const completedElectiveCredits = Number(req.body.electiveCredits || 0);

    //Gathers Remaining Major Courses
    const remainingCourses = requiredMajorCourses.filter(c => !completedMajorCourses.includes(c));

    //Calculates Gen Ed Credits
    const remainingGenEd = [];
    let totalGenEdRequired = 0;
    let totalGenEdEarned = 0;

    for (const category in generalEducation) {
        const maxRequired = generalEducation[category];
        const userEarned = Number(completedGenEdCredits[category] || 0);

        if (userEarned < maxRequired) {
            const missing = maxRequired - userEarned;
            remainingGenEd.push(`${category}: ${missing} credits needed`);
        }
    }

    //Calculates Elective Credits
    const remainingElectiveCredits = Math.max(0, electiveCredits - completedElectiveCredits);

    res.json({
        remainingCourses,
        remainingGenEd,
        completedElectiveCredits,
        remainingElectiveCredits,
        isCleared: (remainingCourses.length === 0 && remainingGenEd.length === 0 && remainingElectiveCredits === 0)
    });
});


app.listen(PORT, () => {
    console.log(`Graduation Tracker is running at http://localhost:${PORT}`);
});