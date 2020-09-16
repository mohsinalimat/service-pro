// Copyright (c) 2020, jan and contributors
// For license information, please see license.txt

frappe.ui.form.on('Site Job Report', {
	// refresh: function(frm) {

	// }
});

cur_frm.cscript.warehouse = function (frm,cdt, cdn) {
    var d = locals[cdt][cdn]
    if(d.item_code && d.warehouse){
        frappe.call({
            method: "service_pro.service_pro.doctype.production.production.get_rate",
            args: {
                item_code: d.item_code,
                warehouse: d.warehouse ? d.warehouse : "",
                based_on: cur_frm.doc.rate_of_materials_based_on ? cur_frm.doc.rate_of_materials_based_on : "",
                price_list: cur_frm.doc.price_list ? cur_frm.doc.price_list : ""

            },
            callback: function (r) {
                d.rate_raw_material = r.message[0]
                d.amount_raw_material = r.message[0] * d.qty_raw_material
                d.available_qty = r.message[1]
                cur_frm.refresh_field("raw_material")
                                compute_raw_material_total(cur_frm)

            }
        })
    }

}
cur_frm.cscript.item_code = function (frm,cdt, cdn) {
    var d = locals[cdt][cdn]
    if(d.item_code){
        frappe.call({
            method: "service_pro.service_pro.doctype.production.production.get_rate",
            args: {
                item_code: d.item_code,
                warehouse: d.warehouse ? d.warehouse : "",
                based_on: cur_frm.doc.rate_of_materials_based_on ? cur_frm.doc.rate_of_materials_based_on : "",
                price_list: cur_frm.doc.price_list ? cur_frm.doc.price_list : ""

            },
            callback: function (r) {
                 frappe.db.get_doc("Item", d.item_code)
                    .then(doc => {
                        console.log("NAA MAN")
                        d.item_name= doc.item_name
                       d.umo = doc.stock_uom

                        cur_frm.refresh_field("raw_material")
                    })
                d.rate_raw_material = r.message[0]
                d.amount_raw_material = r.message[0] * d.qty_raw_material
                d.available_qty = r.message[1]
                cur_frm.refresh_field("raw_material")
                compute_raw_material_total(cur_frm)
            }
        })
    }

}
cur_frm.cscript.qty_raw_material = function (frm,cdt,cdn) {
    frappe.db.get_single_value('Stock Settings', 'allow_negative_stock')
        .then(ans => {
            var d = locals[cdt][cdn]
            if(d.production){
                frappe.call({
                    method: "service_pro.service_pro.doctype.production.production.get_available_qty",
                    args: {
                        production: d.production
                    },
                    async: false,
                    callback: function (r) {
                        if(d.qty_raw_material > r.message){
                            var qty_ = d.qty_raw_material
                             d.qty_raw_material = r.message

                            cur_frm.refresh_field("raw_material")
                            frappe.throw("Can't change Qty to " + qty_.toString() + ". Maximum Available qty is " + r.message.toString())
                        } else {
                              frappe.db.get_doc("Production", d.production)
                            .then(doc => {
                                if(doc.qty % d.qty_raw_material === 0){
                                    d.rate_raw_material = doc.rate / (doc.qty / d.qty_raw_material)
                                    d.amount_raw_material = doc.rate / (doc.qty / d.qty_raw_material)
                                } else {
                                    d.rate_raw_material = doc.rate / d.qty_raw_material
                                    d.amount_raw_material = doc.rate / d.qty_raw_material
                                }

                                cur_frm.refresh_field("raw_material")
                            })
                        }


                    }
                })

            } else {
                if((d.qty_raw_material && d.qty_raw_material <= d.available_qty) || ans){
                d.amount_raw_material = d.rate_raw_material * d.qty_raw_material
                cur_frm.refresh_field("raw_material")
                } else {
                    var qty = d.qty_raw_material
                    d.qty_raw_material = d.available_qty
                    d.amount_raw_material = d.rate_raw_material * d.available_qty
                    cur_frm.refresh_field("raw_material")
                    frappe.throw("Not enough stock. Can't change to " + qty.toString())

                }
            }

            compute_raw_material_total(cur_frm)

        })

}
cur_frm.cscript.production = function (frm,cdt, cdn) {
    var d = locals[cdt][cdn]
    if(d.production){
        frappe.db.get_doc('Production', d.production)
            .then(prod => {
                frappe.call({
                    method: "service_pro.service_pro.doctype.production.production.get_available_qty",
                    args: {
                        production: d.production
                    },
                    callback: function (r) {
                        d.qty_raw_material = r.message

                        if(prod.qty % d.qty_raw_material === 0){
                            d.rate_raw_material = prod.rate / (prod.qty / d.qty_raw_material)
                            d.amount_raw_material = prod.rate / (prod.qty / d.qty_raw_material)
                        } else {
                            d.rate_raw_material = prod.rate / d.qty_raw_material
                            d.amount_raw_material = prod.rate / d.qty_raw_material
                        }
                        cur_frm.refresh_field("raw_material")
                        compute_raw_material_total(cur_frm)
                    }
                })


            })
    }

}

function compute_raw_material_total(cur_frm) {
    var amount = 0
    for(var x=0;x<cur_frm.doc.raw_material.length;x += 1){
        amount += cur_frm.doc.raw_material[x].amount_raw_material
    }
    cur_frm.doc.total = amount
    cur_frm.refresh_field("total")
}