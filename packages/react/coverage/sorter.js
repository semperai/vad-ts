/* eslint-disable */
var addSorting = (function() {
    'use strict';
    var cols,
        currentSort = {
            index: 0,
            desc: false
        };

    /**
     * Get the coverage summary table element from the document.
     * @returns {Element|null} The element with class `coverage-summary`, or `null` if none exists.
     */
    function getTable() {
        return document.querySelector('.coverage-summary');
    }
    /**
     * Get the header row element of the coverage summary table.
     * @returns {HTMLTableRowElement|null} The `tr` element inside the table's `thead`, or `null` if the table or header row is not found.
     */
    function getTableHeader() {
        return getTable().querySelector('thead tr');
    }
    /**
     * Retrieve the table body element of the coverage summary table.
     * @returns {HTMLTableSectionElement|null} The table's tbody element, or `null` if the table or tbody is not found.
     */
    function getTableBody() {
        return getTable().querySelector('tbody');
    }
    /**
     * Retrieve the header cell for the given column index.
     * @param {number} n - Zero-based index of the column to retrieve.
     * @returns {HTMLTableCellElement|undefined} The corresponding <th> element, or `undefined` if the index is out of range.
     */
    function getNthColumn(n) {
        return getTableHeader().querySelectorAll('th')[n];
    }

    /**
     * Filters rows of the first table body based on the value of the '#fileSearch' input.
     *
     * Attempts to interpret the input as a case-insensitive regular expression; if the pattern is invalid,
     * falls back to a case-insensitive substring search. Rows that match remain visible; non-matching rows are hidden.
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
     * Injects the search/filter UI into the page and binds the filter input handler.
     *
     * Locates the template with id "filterTemplate", appends its cloned content into the template's parent,
     * and attaches the `onFilterInput` handler to the input element with id "fileSearch" within the clone.
     */
    function addSearchBox() {
        var template = document.getElementById('filterTemplate');
        var templateClone = template.content.cloneNode(true);
        templateClone.getElementById('fileSearch').oninput = onFilterInput;
        template.parentElement.appendChild(templateClone);
    }

    /**
     * Build metadata for each table header column and mark sortable headers in the DOM.
     *
     * Returns an array of column descriptor objects with keys:
     * - `key`: the column identifier from the header's `data-col` attribute.
     * - `sortable`: `true` if the header is sortable (no `data-nosort` attribute), `false` otherwise.
     * - `type`: the column type from `data-type`, or `"string"` if absent.
     * - `defaultDescSort` (present for sortable columns): `true` when `type` is `"number"`, otherwise `false`.
     *
     * While building metadata, appends a `<span class="sorter"></span>` to each sortable header cell.
     * @returns {Array<Object>} Array of column descriptor objects as described above.
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
     * Reads each cell's `data-value` attribute in the provided table row and returns an object whose keys are the column identifiers.
     * Numeric columns are converted to JavaScript Numbers.
     *
     * @param {HTMLTableRowElement} tableRow - A table row (<tr>) whose cells (<td>) contain `data-value` attributes in the same order as the module's columns.
     * @returns {Object<string, any>} An object mapping column keys to their corresponding cell values; numeric columns produce Number values.
     */
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
     * Attach parsed column data to every table row in the coverage summary body.
     *
     * For each TR in the table body, parses that row's cell values and assigns the resulting
     * object to the row's `data` property.
     */
    function loadData() {
        var rows = getTableBody().querySelectorAll('tr'),
            i;

        for (i = 0; i < rows.length; i += 1) {
            rows[i].data = loadRowData(rows[i]);
        }
    }
    /**
     * Reorders the coverage-summary table rows by the specified column.
     *
     * Sorts rows using each row's bound `data` for the column at `index` and updates the DOM order
     * of the table body accordingly. If `desc` is true, sorts in descending order.
     *
     * @param {number} index - Zero-based index of the column to sort by.
     * @param {boolean} desc - Whether to sort in descending order.
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
     * Remove any active sort indicator classes from the currently sorted header column.
     *
     * If the header cell for the current sort index exists, this clears trailing `sorted` or `sorted-desc` classes from its `className`.
     */
    function removeSortIndicators() {
        var col = getNthColumn(currentSort.index),
            cls = col.className;

        cls = cls.replace(/ sorted$/, '').replace(/ sorted-desc$/, '');
        col.className = cls;
    }
    /**
     * Add a CSS class to the currently sorted column header to indicate sort direction.
     *
     * Appends either `sorted-desc` if the current sort is descending or `sorted` if ascending to the header cell's class list.
     */
    function addSortIndicators() {
        getNthColumn(currentSort.index).className += currentSort.desc
            ? ' sorted-desc'
            : ' sorted';
    }
    /**
     * Wire click handlers to each sortable column header to enable interactive sorting.
     *
     * When a sortable column header (the sorter widget's parent element) is clicked, the table is sorted by that column;
     * the sort direction toggles if the column is already active, otherwise the column's default direction is used.
     * The function also updates the module's currentSort state and refreshes visible sort indicators.
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