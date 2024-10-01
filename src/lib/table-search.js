// Put event listener on the input - cll function searchTable
document.querySelectorAll("input").forEach((input, index) => {
  input.addEventListener("input", () => {
    searchTable(index, input.value);
  });
});

// Filter table based on input value -
function searchTable(columnIndex, searchValue) {
  const table = document.getElementById("worksTable");
  const rows = table.querySelectorAll("tbody tr");
  rows.forEach((row) => {
    const cellValue = row.children[columnIndex].textContent.toLowerCase();
    if (cellValue.includes(searchValue.toLowerCase())) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}
