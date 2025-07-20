const deleted_for = "salim,shaan";
const username = "shaan";

const usernames = deleted_for.split(",").map(name => name.trim());



console.log(usernames.includes(username)); // true
console.log(usernames.includes(username)); // true
