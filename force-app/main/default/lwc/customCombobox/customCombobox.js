import { LightningElement, track, api } from 'lwc';

export default class CustomCombobox extends LightningElement {
    @api label = "Select Objects";
    @api placeholder;
    @api searchOptions = [
        {
            label: "Hello 1"
        }, {
            label: "Hello 2"
        },
    ]
    @api selectedOptions = [
        {
            label:"Hello 1"
        }
    ]
}