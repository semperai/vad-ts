/* eslint-disable */
var addSorting = (function() {
    'use strict';
    var cols,
        currentSort = {
            index: 0,
            desc: false
        };

    /**
     * Finds the coverage summary table in the document.
     * @returns {HTMLElement|null} The first element with class "coverage-summary", or `null` if none exists.
     */
    function getTable() {
        return document.querySelector('.coverage-summary');
    }
    /**
     * Get the first header row of the coverage summary table.
     * @returns {HTMLTableRowElement|null} The first <tr> inside the table's <thead>, or `null` if none exists.
     */
    function getTableHeader() {
        return getTable().querySelector('thead tr');
    }
    /**
     * Retrieve the tbody element of the coverage summary table.
     * @returns {HTMLTableSectionElement} The table body (`tbody`) element.
     */
    function getTableBody() {
        return getTable().querySelector('tbody');
    }
    /**
     * Retrieve the header cell for the given column index.
     * @param {number} n - Zero-based column index.
     * @returns {HTMLTableHeaderCellElement|undefined} The <th> element at that index, or `undefined` if out of range.
     */
    function getNthColumn(n) {
        return getTableHeader().querySelectorAll('th')[n];
    }

    /**
     * Filters table body rows based on the current value of the '#fileSearch' input.
     *
     * Attempts to interpret the input as a case-insensitive regular expression; if the
     * pattern is invalid, falls back to a case-insensitive substring search. Rows that
     * do not match are hidden by setting their `style.display` to 'none'; matching rows
     * are shown by clearing `style.display`.
     */
    function onFilterInput() {
        const searchValue = document.getElementById('fileSearch').value;
        const rows = document.getElementsByTagName('tbody')[0].children;

        // Try to create a RegExp from the searchValue. If it fails (invalid regex),
        // it will be treated as a plain text search
        let searchRegex;
        try {
            searchRegex = new RegExp(searchValue, 'i'); // 'i' for case-insensitive
        } catch (error) {
            searchRegex = null;
        }

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            let isMatch = false;

            if (searchRegex) {
                // If a valid regex was created, use it for matching
                isMatch = searchRegex.test(row.textContent);
            } else {
                // Otherwise, fall back to the original plain text search
                isMatch = row.textContent
                    .toLowerCase()
                    .includes(searchValue.toLowerCase());
            }

            row.style.display = isMatch ? '' : 'none';
        }
    }

    /**
     * Inserts the search/filter UI from the '#filterTemplate' template into the DOM and connects its input to the filter handler.
     *
     * Clones the template content with id 'filterTemplate', binds the cloned element with id 'fileSearch' to onFilterInput, and appends the clone to the template's parent node.
     */
    function addSearchBox() {
        var template = document.getElementById('filterTemplate');
        var templateClone = template.content.cloneNode(true);
        templateClone.getElementById('fileSearch').oninput = onFilterInput;
        template.parentElement.appendChild(templateClone);
    }

    /**
     * Build metadata for each table header column and prepare sortable headers.
     *
     * Iterates the table header's TH cells to produce an array of column descriptors.
     * For each descriptor: `key` is taken from the `data-col` attribute, `sortable`
     * is false when `data-nosort` is present, and `type` is taken from
     * `data-type` or defaults to `'string'`. For sortable columns a boolean
     * `defaultDescSort` is added (true when `type` is `'number'`), and a
     * <span class="sorter"> element is appended to the header cell to indicate
     * sortability.
     *
     * @returns {Object[]} Array of column metadata objects. Each object contains:
     *   - `key` {string} column identifier from `data-col`
     *   - `sortable` {boolean} whether the column can be sorted
     *   - `type` {string} the column type ('string' or 'number', etc.)
     *   - `defaultDescSort` {boolean=} present for sortable columns, true when the
     *     column's type is 'number'
     */
    function loadColumns() {
        var colNodes = getTableHeader().querySelectorAll('th'),
            colNode,
            cols = [],
            col,
            i;

        for (i = 0; i < colNodes.length; i += 1) {
            colNode = colNodes[i];
            col = {
                key: colNode.getAttribute('data-col'),
                sortable: !colNode.getAttribute('data-nosort'),
                type: colNode.getAttribute('data-type') || 'string'
            };
            cols.push(col);
            if (col.sortable) {
                col.defaultDescSort = col.type === 'number';
                colNode.innerHTML =
                    colNode.innerHTML + '<span class="sorter"></span>';
            }
        }
        return cols;
    }
    // attaches a data attribute to every tr element with an object
    /**
     * Build an object mapping column keys to the row's cell values.
     *
     * Reads each cell's `data-value` attribute and returns an object whose keys are the column names
     * discovered earlier and whose values are the corresponding cell values; values are converted to
     * Numbers when the column's type is `"number"`.
     *
     * @param {HTMLTableRowElement} tableRow - The table row element whose cells provide values.
     * @returns {Object<string, (string|number)>} An object keyed by column key with cell values.
    function loadRowData(tableRow) {
        var tableCols = tableRow.querySelectorAll('td'),
            colNode,
            col,
            data = {},
            i,
            val;
        for (i = 0; i < tableCols.length; i += 1) {
            colNode = tableCols[i];
            col = cols[i];
            val = colNode.getAttribute('data-value');
            if (col.type === 'number') {
                val = Number(val);
            }
            data[col.key] = val;
        }
        return data;
    }
    /**
     * Populates each table body row with a structured data object representing its cell values.
     *
     * Iterates all <tr> elements in the summary table body and assigns a `data` property to each row.
     * The `data` object maps column keys to the corresponding cell values (with numeric conversion where applicable).
     */
    function loadData() {
        var rows = getTableBody().querySelectorAll('tr'),
            i;

        for (i = 0; i < rows.length; i += 1) {
            rows[i].data = loadRowData(rows[i]);
        }
    }
    /**
     * Reorders the coverage-summary table rows based on the data for a given column.
     *
     * Sorts the tbody rows of the table with class "coverage-summary" by the column identified by `index`, and updates the DOM order to reflect the sorted result.
     * @param {number} index - Zero-based index of the column to sort by (matches the loaded `cols` array).
     * @param {boolean} desc - If `true`, sort in descending order; otherwise sort in ascending order.
     */
    function sortByIndex(index, desc) {
        var key = cols[index].key,
            sorter = function(a, b) {
                a = a.data[key];
                b = b.data[key];
                return a < b ? -1 : a > b ? 1 : 0;
            },
            finalSorter = sorter,
            tableBody = document.querySelector('.coverage-summary tbody'),
            rowNodes = tableBody.querySelectorAll('tr'),
            rows = [],
            i;

        if (desc) {
            finalSorter = function(a, b) {
                return -1 * sorter(a, b);
            };
        }

        for (i = 0; i < rowNodes.length; i += 1) {
            rows.push(rowNodes[i]);
            tableBody.removeChild(rowNodes[i]);
        }

        rows.sort(finalSorter);

        for (i = 0; i < rows.length; i += 1) {
            tableBody.appendChild(rows[i]);
        }
    }
    /**
     * Remove sort indicator classes from the currently sorted header column.
     *
     * Clears trailing "sorted" or "sorted-desc" CSS classes from the header cell at the current sort index.
     */
    function removeSortIndicators() {
        var col = getNthColumn(currentSort.index),
            cls = col.className;

        cls = cls.replace(/ sorted$/, '').replace(/ sorted-desc$/, '');
        col.className = cls;
    }
    /**
     * Add a CSS class to the currently sorted header column to reflect the active sort direction.
     *
     * Appends " sorted" when sorting ascending or " sorted-desc" when sorting descending to the
     * header cell at the index specified by `currentSort.index`.
     */
    function addSortIndicators() {
        getNthColumn(currentSort.index).className += currentSort.desc
            ? ' sorted-desc'
            : ' sorted';
    }
    /**
     * Attach click handlers to sortable header cells to enable column sorting.
     *
     * When a sortable column header is clicked, the table is sorted by that column;
     * clicking the currently active column toggles the sort direction, otherwise the
     * column's default direction is used. The active column index and direction are
     * stored in `currentSort` and visual sort indicators are updated.
     */
    function enableUI() {
        var i,
            el,
            ithSorter = function ithSorter(i) {
                var col = cols[i];

                return function() {
                    var desc = col.defaultDescSort;

                    if (currentSort.index === i) {
                        desc = !currentSort.desc;
                    }
                    sortByIndex(i, desc);
                    removeSortIndicators();
                    currentSort.index = i;
                    currentSort.desc = desc;
                    addSortIndicators();
                };
            };
        for (i = 0; i < cols.length; i += 1) {
            if (cols[i].sortable) {
                // add the click event handler on the th so users
                // dont have to click on those tiny arrows
                el = getNthColumn(i).querySelector('.sorter').parentElement;
                if (el.addEventListener) {
                    el.addEventListener('click', ithSorter(i));
                } else {
                    el.attachEvent('onclick', ithSorter(i));
                }
            }
        }
    }
    // adds sorting functionality to the UI
    return function() {
        if (!getTable()) {
            return;
        }
        cols = loadColumns();
        loadData();
        addSearchBox();
        addSortIndicators();
        enableUI();
    };
})();

window.addEventListener('load', addSorting);