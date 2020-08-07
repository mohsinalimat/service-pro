# -*- coding: utf-8 -*-
# Copyright (c) 2020, jan and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document

class Inspection(Document):
	def on_submit(self):
		contact_person = frappe.db.sql(""" SELECT * FROM `tabService Receipt Note` WHERE name=%s """, self.service_receipt_note, as_dict=1)
		doc = {
			"doctype": "Estimation",
			"customer": self.customer,
			"customer_name": self.customer_name,

			"customer_reference": self.customer_reference,
			"item_code_est": self.item_code,
			"item_name": self.item_name,
			"qty": self.qty,
			"receipt_note": self.service_receipt_note,
			"inspection": self.name,
			"contact_person": contact_person[0].contact_person
		}

		frappe.get_doc(doc).insert()
