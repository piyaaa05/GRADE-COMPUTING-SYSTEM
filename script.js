
const SUPABASE_URL =
    "https://ipzzigutccclcstgbqaz.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_4R2HN7001f0vEJUP98XtqQ_NmK6GAqk";

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ==========================================
// REGISTER ACCOUNT
// ==========================================

async function registerUser() {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        alert("Enter email and password!");
        return;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters!");
        return;
    }

    const { data, error } = await db.auth.signUp({
        email: email,
        password: password
    });

    if (error) {
        alert("Registration Error: " + error.message);
        return;
    }

    if (data.session) {
        alert("Registration successful! You are now logged in.");
    } else {
        alert("Registration successful! Check your email to confirm your account, then log in.");
    }
}


// ==========================================
// LOGIN ACCOUNT
// ==========================================

async function loginUser() {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        alert("Enter email and password!");
        return;
    }

    const { data, error } = await db.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        alert("Login Error: " + error.message);
        return;
    }

    alert("Login successful! You can now save students.");

    document.getElementById("authMessage").textContent =
        "Logged in as: " + data.user.email;
}


// ==========================================
// LOGOUT ACCOUNT
// ==========================================

async function logoutUser() {

    const { error } = await db.auth.signOut();

    if (error) {
        alert(error.message);
        return;
    }

    alert("Successfully logged out!");

    document.getElementById("authMessage").textContent =
        "Not logged in";
}


// COMPUTE GRADE

function computeGrade() {

    const p = document.getElementById("prelim").value;
    const m = document.getElementById("midterm").value;
    const f = document.getElementById("final").value;

    if (p === "" || m === "" || f === "") {
        alert("Please complete all grades!");
        return;
    }

    const prelim = Number(p);
    const midterm = Number(m);
    const finalGrade = Number(f);

    if (![prelim, midterm, finalGrade].every(
        n => Number.isFinite(n) && n >= 0 && n <= 100
    )) {
        alert("Grades must be between 0 and 100!");
        return;
    }

    const average = (prelim + midterm + finalGrade) / 3;

    document.getElementById("average").value =
        average.toFixed(2);

    document.getElementById("remarks").value =
        average >= 75 ? "PASSED" : "FAILED";
}


// SAVE STUDENT

async function saveStudent() {

    const button = document.getElementById("saveBtn");

    const studentName =
        document.getElementById("studentName").value.trim();

    const studentId =
        document.getElementById("studentId").value.trim();

    const p = document.getElementById("prelim").value;
    const m = document.getElementById("midterm").value;
    const f = document.getElementById("final").value;

    if (!studentName || !studentId) {
        alert("Please enter Student Name and Student ID!");
        return;
    }

    if (p === "" || m === "" || f === "") {
        alert("Please complete all grades!");
        return;
    }

    const prelim = Number(p);
    const midterm = Number(m);
    const finalGrade = Number(f);

    if (![prelim, midterm, finalGrade].every(
        n => Number.isFinite(n) && n >= 0 && n <= 100
    )) {
        alert("Grades must be between 0 and 100!");
        return;
    }

    const average = (prelim + midterm + finalGrade) / 3;

    button.disabled = true;
    button.textContent = "Saving...";

    try {

        // Check login session

        const { data: sessionData, error: sessionError } =
            await db.auth.getSession();

        if (sessionError) throw sessionError;

        const user = sessionData.session?.user;

        if (!user) {
            alert("Please login first!");
            return;
        }

        // Save student

        const { error } = await db
            .from("grades")
            .insert([{
                user_id: user.id,
                student_name: studentName,
                student_id: studentId,
                prelim: prelim,
                midterm: midterm,
                final: finalGrade,
                average: Number(average.toFixed(2))
            }]);

        if (error) throw error;

        alert("Student successfully saved!");

        clearForm();

        await loadStudents();

    } catch (error) {

        console.error(error);
        alert("Error: " + error.message);

    } finally {

        button.disabled = false;
        button.textContent = "Save Student";
    }
}


// VIEW STUDENTS

async function loadStudents() {

    const list = document.getElementById("studentList");

    list.textContent = "Loading students...";

    try {

        const { data: sessionData, error: sessionError } =
            await db.auth.getSession();

        if (sessionError) throw sessionError;

        const user = sessionData.session?.user;

        if (!user) {
            list.textContent = "Please login first.";
            return;
        }

        const { data, error } = await db
            .from("grades")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        list.replaceChildren();

        if (!data || data.length === 0) {
            list.textContent = "No students saved yet.";
            return;
        }

        data.forEach(student => {

            const item = document.createElement("div");
            item.className = "student-item";

            const name = document.createElement("strong");
            name.textContent = student.student_name;

            const details = document.createElement("p");
            details.textContent =
                "ID: " + student.student_id +
                " | Average: " + student.average +
                " | " + (student.average >= 75 ? "PASSED" : "FAILED");

            item.append(name, details);
            list.appendChild(item);
        });

    } catch (error) {

        console.error(error);
        list.textContent = "Error loading students: " + error.message;
    }
}


// CLEAR FORM

function clearForm() {

    document.getElementById("studentId").value = "";
    document.getElementById("studentName").value = "";
    document.getElementById("prelim").value = "";
    document.getElementById("midterm").value = "";
    document.getElementById("final").value = "";
    document.getElementById("average").value = "";
    document.getElementById("remarks").value = "";
}


// INITIALIZE

console.log("Grade Computing System JavaScript loaded!");
console.log("Supabase initialized:", !!db);
