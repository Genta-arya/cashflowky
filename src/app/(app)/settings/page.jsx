"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { AccountForm } from "@/components/settings/AccountForm";
import { CategoryForm } from "@/components/settings/CategoryForm";
import { ContactForm } from "@/components/settings/ContactForm";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { useContacts } from "@/hooks/use-contacts";
import { formatRupiah } from "@/lib/format";
import {
  Wallet,
  Tag,
  Users,
  Plus,
  Pencil,
  Trash2,
  Lock,
  Power,
  Phone,
  FileText,
} from "lucide-react";



export default function SettingsPage() {
  const {
    accounts,
    addAccount,
    updateAccount,
    toggleAccountActive,
    deleteAccount,
  } = useAccounts();

  const {
    allCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();

  const {
    contacts,
    addContact,
    updateContact,
    deleteContact,
  } = useContacts();

  // Modals state
  const [accountModal, setAccountModal] = useState({ open: false, data: null });
  const [categoryModal, setCategoryModal] = useState({ open: false, data: null });
  const [contactModal, setContactModal] = useState({ open: false, data: null });

  // Delete Confirm Dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  return (
    <div>
      <PageHeader
        title="Pengaturan"
        description="Kelola master data dompet rekening, kategori transaksi, dan buku kontak"
      />

      <Tabs defaultValue="accounts" className="w-full space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-2xl w-full sm:w-auto grid grid-cols-3 max-w-md">
          <TabsTrigger
            value="accounts"
            className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-xs text-xs sm:text-sm font-semibold gap-1.5"
          >
            <Wallet className="w-4 h-4 text-indigo-600" />
            Dompet
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-xs text-xs sm:text-sm font-semibold gap-1.5"
          >
            <Tag className="w-4 h-4 text-emerald-600" />
            Kategori
          </TabsTrigger>
          <TabsTrigger
            value="contacts"
            className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-xs text-xs sm:text-sm font-semibold gap-1.5"
          >
            <Users className="w-4 h-4 text-sky-600" />
            Kontak
          </TabsTrigger>
        </TabsList>

        {/* ================= TAB 1: DOMPET ================= */}
        <TabsContent value="accounts" className="space-y-4 focus-visible:outline-none">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 font-medium">
              Daftar dompet dan rekening aktif Anda
            </p>
            <Button
              onClick={() => setAccountModal({ open: true, data: null })}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-xs"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              Tambah Dompet
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc) => (
              <Card
                key={acc.id}
                className={`rounded-2xl border transition-all ${
                  acc.isActive
                    ? "bg-white border-slate-200/80 shadow-xs hover:shadow-md"
                    : "bg-slate-50 border-slate-200/60 opacity-60"
                }`}
              >
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Badge
                        variant="secondary"
                        className="text-[11px] font-bold rounded-lg px-2 py-0.5 uppercase tracking-wider bg-slate-100 text-slate-700"
                      >
                        {acc.type}
                      </Badge>
                      <button
                        onClick={() => toggleAccountActive(acc.id)}
                        title={acc.isActive ? "Nonaktifkan dompet" : "Aktifkan dompet"}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 ${
                          acc.isActive
                            ? "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                            : "border-slate-300 text-slate-500 bg-slate-100 hover:bg-slate-200"
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        {acc.isActive ? "Aktif" : "Nonaktif"}
                      </button>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                      {acc.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Saldo saat ini</p>
                    <p className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1">
                      {formatRupiah(acc.balance)}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAccountModal({ open: true, data: acc })}
                      className="text-slate-600 hover:text-indigo-600 rounded-lg text-xs"
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" />
                      Ubah
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setConfirmDialog({
                          open: true,
                          title: `Hapus Dompet "${acc.name}"?`,
                          description:
                            "Pastikan dompet ini tidak memiliki riwayat transaksi apa pun.",
                          onConfirm: () => deleteAccount(acc.id),
                        })
                      }
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Hapus
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ================= TAB 2: KATEGORI ================= */}
        <TabsContent value="categories" className="space-y-6 focus-visible:outline-none">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 font-medium">
              Kategori pengeluaran & pemasukan
            </p>
            <Button
              onClick={() => setCategoryModal({ open: true, data: null })}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-xs"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              Tambah Kategori
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Expense Categories */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-rose-600 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Pengeluaran</span>
                <span className="text-xs bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-semibold">
                  {allCategories.filter((c) => c.type === "EXPENSE").length}
                </span>
              </h3>
              <div className="space-y-2">
                {allCategories
                  .filter((c) => c.type === "EXPENSE")
                  .map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-4 h-4 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-sm font-medium text-slate-800">
                          {cat.name}
                        </span>
                        {cat.isSystem && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                            <Lock className="w-3 h-3" />
                            Sistem
                          </span>
                        )}
                      </div>

                      {!cat.isSystem && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCategoryModal({ open: true, data: cat })}
                            className="h-8 w-8 text-slate-400 hover:text-indigo-600 rounded-lg"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setConfirmDialog({
                                open: true,
                                title: `Hapus Kategori "${cat.name}"?`,
                                description:
                                  "Transaksi yang memakai kategori ini akan berubah menjadi 'Tanpa kategori'.",
                                onConfirm: () => deleteCategory(cat.id),
                              })
                            }
                            className="h-8 w-8 text-slate-400 hover:text-rose-600 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Income Categories */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Pemasukan</span>
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                  {allCategories.filter((c) => c.type === "INCOME").length}
                </span>
              </h3>
              <div className="space-y-2">
                {allCategories
                  .filter((c) => c.type === "INCOME")
                  .map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-4 h-4 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-sm font-medium text-slate-800">
                          {cat.name}
                        </span>
                        {cat.isSystem && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                            <Lock className="w-3 h-3" />
                            Sistem
                          </span>
                        )}
                      </div>

                      {!cat.isSystem && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCategoryModal({ open: true, data: cat })}
                            className="h-8 w-8 text-slate-400 hover:text-indigo-600 rounded-lg"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setConfirmDialog({
                                open: true,
                                title: `Hapus Kategori "${cat.name}"?`,
                                description:
                                  "Transaksi yang memakai kategori ini akan berubah menjadi 'Tanpa kategori'.",
                                onConfirm: () => deleteCategory(cat.id),
                              })
                            }
                            className="h-8 w-8 text-slate-400 hover:text-rose-600 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ================= TAB 3: KONTAK ================= */}
        <TabsContent value="contacts" className="space-y-4 focus-visible:outline-none">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 font-medium">
              Buku kontak untuk pencatatan utang & piutang
            </p>
            <Button
              onClick={() => setContactModal({ open: true, data: null })}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-xs"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              Tambah Kontak
            </Button>
          </div>

          {contacts.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title="Belum ada kontak"
              description="Tambahkan kontak rekan atau peminjam untuk mencatat utang piutang."
              actionLabel="Tambah Kontak Baru"
              onAction={() => setContactModal({ open: true, data: null })}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map((con) => (
                <Card
                  key={con.id}
                  className="rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-all"
                >
                  <CardContent className="p-5 flex flex-col justify-between h-full">
                    <div>
                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-base mb-3">
                        {con.name.charAt(0).toUpperCase()}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 tracking-tight">
                        {con.name}
                      </h3>

                      {con.phone ? (
                        <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {con.phone}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 mt-1 italic">
                          Tanpa nomor telepon
                        </p>
                      )}

                      {con.note && (
                        <p className="text-xs text-slate-500 mt-2 flex items-start gap-1.5 bg-slate-50 p-2 rounded-lg">
                          <FileText className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{con.note}</span>
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setContactModal({ open: true, data: con })}
                        className="text-slate-600 hover:text-indigo-600 rounded-lg text-xs"
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" />
                        Ubah
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setConfirmDialog({
                            open: true,
                            title: `Hapus Kontak "${con.name}"?`,
                            description:
                              "Kontak hanya bisa dihapus jika tidak memiliki catatan utang atau piutang aktif.",
                            onConfirm: () => deleteContact(con.id),
                          })
                        }
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Hapus
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Account Modal */}
      <AccountForm
        open={accountModal.open}
        onOpenChange={(open) => setAccountModal({ ...accountModal, open })}
        initialData={accountModal.data}
        onSubmit={(data) => {
          if (accountModal.data) {
            updateAccount(accountModal.data.id, data);
          } else {
            addAccount(data);
          }
        }}
      />

      {/* Category Modal */}
      <CategoryForm
        open={categoryModal.open}
        onOpenChange={(open) => setCategoryModal({ ...categoryModal, open })}
        initialData={categoryModal.data}
        onSubmit={(data) => {
          if (categoryModal.data) {
            updateCategory(categoryModal.data.id, data);
          } else {
            addCategory(data);
          }
        }}
      />

      {/* Contact Modal */}
      <ContactForm
        open={contactModal.open}
        onOpenChange={(open) => setContactModal({ ...contactModal, open })}
        initialData={contactModal.data}
        onSubmit={(data) => {
          if (contactModal.data) {
            updateContact(contactModal.data.id, data);
          } else {
            addContact(data);
          }
        }}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
}
