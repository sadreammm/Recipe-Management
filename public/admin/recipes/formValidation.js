function validateForm() {
    var title = document.getElementById('title').value.trim();
    var category = document.getElementById('category').value.trim();
    var ingredients = document.getElementById('ingredients').value.trim();
    var instructions = document.getElementById('instructions').value.trim();
    var cookTime = document.getElementById('cookTime').value.trim();
    var size = document.getElementById('size').value.trim();
    var image = document.getElementById('image').value.trim();

    // Regular expressions for validation
    var textPattern = /^[A-Za-z0-9\s]+$/;
    var cookTimePattern = /^[0-9]+( [a-zA-Z]+)?$/;
    var sizePattern = /^([0-9])( [a-zA-Z]+)?$/;
    var urlPattern = /^(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;

    if(title==""||category==""||ingredients==""||instructions==""||cookTime==""||size==""||image==""){
        alert("Please fill out all forms");
        return false;
    }
    // Validate title
    if (!textPattern.test(title) || title.length < 3 ) {
        alert("Please enter a valid title (at least 3 characters, no special characters).");
        return false;
    }

    // Validate category
    if (!textPattern.test(category) || category.length < 3) {
        alert("Please enter a valid category (at least 3 characters, no special characters).");
        return false;
    }

    // Validate ingredients
    if (ingredients.length < 10) {
        alert("Please enter valid ingredients (at least 10 characters).");
        return false;
    }

    // Validate instructions
    if (instructions.length < 10) {
        alert("Please enter valid instructions (at least 10 characters).");
        return false;
    }

    // Validate cook time
    if (!cookTimePattern.test(cookTime)) {
        alert("Please enter a valid cook time (e.g., '30 minutes' or '45').");
        return false;
    }

    // Validate serving size
    if (!sizePattern.test(size)) {
        alert("Please enter a valid serving size (e.g., '5 people' or '3').");
        return false;
    }

    // Validate image URL
    if (!urlPattern.test(image)) {
        alert("Please enter a valid image URL.");
        return false;
    }
    var ingredientsText="";

    document.getElementById('ingredients').value = ingredients.replace(/\n/g, '<br/>');
    document.getElementById('instructions').value = instructions.replace(/\n/g, '<br/>');

    return true;
}
