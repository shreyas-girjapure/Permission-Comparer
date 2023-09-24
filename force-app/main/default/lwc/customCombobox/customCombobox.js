import { LightningElement, track, api } from 'lwc';

export default class CustomCombobox extends LightningElement {
    @api label = "Select Objects";
    @api placeholder;
    @api mainOptions = [];
    @track options;

    @track selectedOptions = [];

    showOptions = false;

    connectedCallback() {
        this.options = this.mainOptions;
        // console.log(' here are main options ', this.mainOptions);
    }
    handleSearch(e) {
        let textValue = e.target.value;
        this.options = this.filterArray(this.mainOptions, textValue);
    }

    filterArray(arrayToFilterOn, searchKey) {
        let finalSearchKey = searchKey.trim().toLowerCase()
        let deepCopy = JSON.parse(JSON.stringify(arrayToFilterOn));
        let resultArray = Array.from(deepCopy).filter(item => {
            let finalItemValue = item.value.toLowerCase().trim();
            return finalItemValue.includes(finalSearchKey);
        });
        return resultArray;
    }

    handleItemRemove(event) {
        const index = event.detail.index;
        this.selectedOptions.splice(index, 1);
        let ev = new CustomEvent('optionchange', { detail: this.selectedOptions });
        this.dispatchEvent(ev);
    }
    handleOptionSelection(e) {
        let dataSet = e.currentTarget.dataset;
        // console.log(' the selected ' + JSON.stringify(dataSet));
        let findSimilar = this.selectedOptions.find(item => item.value === dataSet.value);
        if (findSimilar) {
            this.showError('Duplicate Selection is not allowed');
            return;
        }
        this.selectedOptions.push(dataSet);
        // console.log(' the selected options ' + JSON.stringify(this.selectedOptions));
        this.showOptions = false;
        let ev = new CustomEvent('optionchange', { detail: this.selectedOptions });
        this.dispatchEvent(ev);
    }
    handleDropDownShow() {
        this.showOptions = true;
        this.clearValidity();
    }
    blurhandler() {
        this.isBlurred = true;
        this.closeDropDown();
        this.clearValidity();
    }

    closeDropDown() {
        // console.log(` the blur ${this.isBlurred} the hasOptionsOverMouse ${this.hasOptionsOverMouse}`)
        if (this.isBlurred && !this.hasOptionsOverMouse) {
            this.showOptions = false;
        }
    }
    handleMouseIn() {
        this.hasOptionsOverMouse = true;
    }
    handleMouseOut() {
        this.hasOptionsOverMouse = false;
    }
    handleContainerLeave() {
        this.closeDropDown();
    }

    showError(errorMessage) {
        this.template.querySelector('lightning-input').setCustomValidity(errorMessage);
        this.template.querySelector('lightning-input').reportValidity();
    }
    clearValidity() {
        this.template.querySelector('lightning-input').setCustomValidity('');
        this.template.querySelector('lightning-input').reportValidity();

    }


}