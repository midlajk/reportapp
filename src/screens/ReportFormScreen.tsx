import React, { useState, useEffect, useRef } from 'react';
import {
  View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
  Dimensions, TouchableOpacity,
} from 'react-native';
import {
  Text, TextInput, Button, SegmentedButtons, Surface, useTheme,
  Menu, Divider, List, Portal, Dialog, Paragraph, Snackbar,
} from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import {
  TransactionData, WEIGHERS, DEFAULT_ARRIVAL_PRODUCTS,
  calcTotalWeight, calcNetWeight, calcEndProduct,
} from '../types';
import {
  getParties, getProducts, checkTransactionExists,
  saveTransaction, updateTransaction, getNextManualSlipNumber,
} from '../utils/supabase';
import ReportView, { captureAndShareReport } from '../utils/reportGenerator';
import ViewShot from 'react-native-view-shot';
import { Search, Save } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportForm'>;

const { width } = Dimensions.get('window');

const ReportFormScreen: React.FC<Props> = ({ route }) => {
  const { type } = route.params;
  const theme = useTheme();
  const reportRef = useRef<ViewShot>(null);

  // ── Core fields ──
  const [partyName, setPartyName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [weigher, setWeigher] = useState(WEIGHERS[0]);
  const [slipNumber, setSlipNumber] = useState('');
  const [productName, setProductName] = useState(
    type === 'Arrival' ? DEFAULT_ARRIVAL_PRODUCTS[0] : ''
  );

  // ── Weight fields ──
  const [grossWeight, setGrossWeight] = useState('');
  const [bags, setBags] = useState('');
  const [bagWeight, setBagWeight] = useState('');
  const [deduction, setDeduction] = useState('0');
  const [outturn, setOutturn] = useState('');
  const [moisture, setMoisture] = useState('');

  // ── Autocomplete & Menu ──
  const [allParties, setAllParties] = useState<string[]>([]);
  const [partySuggestions, setPartySuggestions] = useState<string[]>([]);
  const [showPartySuggestions, setShowPartySuggestions] = useState(false);
  const [allProducts, setAllProducts] = useState<string[]>([]);
  const [productMenuVisible, setProductMenuVisible] = useState(false);
  const [weigherMenuVisible, setWeigherMenuVisible] = useState(false);

  // ── Edit/Check state ──
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [duplicateDialogVisible, setDuplicateDialogVisible] = useState(false);
  const [existingRecord, setExistingRecord] = useState<any>(null);

  // ── Status ──
  const [isSaving, setIsSaving] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarColor, setSnackbarColor] = useState('#4CAF50');
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Auto-assign slip number when Manual is selected
    if (weigher === 'Manual') {
      (async () => {
        const nextSlip = await getNextManualSlipNumber();
        setSlipNumber(nextSlip);
      })();
    }
  }, [weigher]);

  const loadInitialData = async () => {
    const [parties, products] = await Promise.all([getParties(), getProducts()]);
    setAllParties(parties);
    setAllProducts(products);
  };

  // ── Computed values ──
  const gw = parseFloat(grossWeight) || 0;
  const b = parseInt(bags, 10) || 0;
  const bw = parseFloat(bagWeight) || 0;
  const ded = parseFloat(deduction) || 0;
  const ot = parseFloat(outturn) || 0;
  const mo = parseFloat(moisture) || 0;

  const totalWeight = calcTotalWeight(gw, b, bw);
  const netWeight = calcNetWeight(totalWeight, ded);
  const endProduct = calcEndProduct(netWeight, ot);

  // ── Party autocomplete ──
  const handlePartyChange = (text: string) => {
    setPartyName(text);
    if (text.trim().length > 0) {
      const filtered = allParties.filter(
        p => p.toLowerCase().includes(text.toLowerCase()) && p.toLowerCase() !== text.toLowerCase()
      );
      setPartySuggestions(filtered);
      setShowPartySuggestions(filtered.length > 0);
    } else {
      setPartySuggestions([]);
      setShowPartySuggestions(false);
    }
  };

  // ── Check for existing record ──
  const handleCheckExisting = async () => {
    if (!weigher || !slipNumber) {
      showSnack('Enter Weigher and Slip Number first', '#FF5722');
      return;
    }
    setIsChecking(true);
    try {
      const result = await checkTransactionExists(weigher, slipNumber);
      if (result.exists && result.record) {
        setExistingRecord(result.record);
        setDuplicateDialogVisible(true);
      } else {
        showSnack('No existing record found. You can save a new one.', '#4CAF50');
      }
    } catch (e: any) {
      showSnack(`Check failed: ${e.message}`, '#FF5722');
    } finally {
      setIsChecking(false);
    }
  };

  const handleEditConfirm = () => {
    setDuplicateDialogVisible(false);
    if (existingRecord) {
      setIsEditing(true);
      setEditingId(existingRecord.id);
      // Pre-fill form with existing data
      setPartyName(existingRecord.party_name || '');
      setVehicleNumber(existingRecord.vehicle_number || '');
      setWeigher(existingRecord.weigher || WEIGHERS[0]);
      setSlipNumber(existingRecord.weighment_slip_number || '');
      setProductName(existingRecord.product_name || '');
      setGrossWeight(existingRecord.gross_weight?.toString() || '');
      setBags(existingRecord.bags?.toString() || '');
      setBagWeight(existingRecord.bag_weight?.toString() || '');
      setDeduction(existingRecord.deduction?.toString() || '0');
      setOutturn(existingRecord.outturn?.toString() || '');
      setMoisture(existingRecord.moisture?.toString() || '');
      showSnack('Editing existing record', '#F5A623');
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setExistingRecord(null);
  };

  // ── Save & share report ──
  const handleSave = async () => {
    if (!partyName.trim() || !vehicleNumber.trim() || !slipNumber || !productName || !grossWeight || !bags || !bagWeight || !outturn || !moisture) {
      showSnack('Please fill all required fields', '#FF5722');
      return;
    }

    setIsSaving(true);
    try {
      const txData = {
        type: type.toLowerCase() as 'arrival' | 'dispatch',
        date: new Date().toISOString().split('T')[0],
        party_name: partyName.trim(),
        vehicle_number: vehicleNumber.trim(),
        weigher,
        weighment_slip_number: slipNumber,
        product_name: productName,
        gross_weight: gw,
        bags: b,
        bag_weight: bw,
        total_weight: totalWeight,
        deduction: ded,
        net_weight: netWeight,
        outturn: ot,
        moisture: mo,
        end_product: endProduct,
      };

      let savedRecord;
      if (isEditing && editingId) {
        savedRecord = await updateTransaction(editingId, txData);
        showSnack('Record updated successfully!', '#4CAF50');
      } else {
        // Double check for duplicate before saving
        const dupCheck = await checkTransactionExists(weigher, slipNumber);
        if (dupCheck.exists) {
          setExistingRecord(dupCheck.record);
          setDuplicateDialogVisible(true);
          setIsSaving(false);
          return;
        }
        savedRecord = await saveTransaction(txData);
        showSnack('Record saved successfully!', '#4CAF50');
      }

      // Generate and share report image
      const reportData: TransactionData = {
        ...txData,
        id: savedRecord.id,
        serial_number: savedRecord.serial_number,
      };

      setShowReport(true);
      // Small delay to allow the report view to render
      setTimeout(async () => {
        try {
          await captureAndShareReport(reportRef);
        } catch (err: any) {
          console.error('Share error:', err);
          showSnack('Saved! But sharing failed: ' + err.message, '#FF9800');
        }
        setShowReport(false);
      }, 500);

      // Refresh party list
      loadInitialData();
      if (isEditing) {
        setIsEditing(false);
        setEditingId(null);
        setExistingRecord(null);
      }
    } catch (error: any) {
      showSnack(`Save failed: ${error.message}`, '#FF5722');
    } finally {
      setIsSaving(false);
    }
  };

  const showSnack = (msg: string, color: string) => {
    setSnackbarMessage(msg);
    setSnackbarColor(color);
    setSnackbarVisible(true);
  };

  // ── Build transaction data for report preview ──
  const currentTxData: TransactionData = {
    type: type.toLowerCase() as 'arrival' | 'dispatch',
    date: new Date().toISOString().split('T')[0],
    party_name: partyName.trim() || '—',
    vehicle_number: vehicleNumber.trim() || '—',
    weigher,
    weighment_slip_number: slipNumber || '—',
    product_name: productName || '—',
    gross_weight: gw,
    bags: b,
    bag_weight: bw,
    total_weight: totalWeight,
    deduction: ded,
    net_weight: netWeight,
    outturn: ot,
    moisture: mo,
    end_product: endProduct,
  };

  const slipDisplayNo = slipNumber
    ? `${weigher.substring(0, 3).toUpperCase()}-${slipNumber}`
    : '';

  // ── Product options for dispatch or arrival "Other" ──
  // Filter out default products for the "Other" dropdown
  const nonDefaultProducts = allProducts.filter(
    p => !DEFAULT_ARRIVAL_PRODUCTS.includes(p.toUpperCase()) &&
         !DEFAULT_ARRIVAL_PRODUCTS.includes(p)
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Edit Mode Banner */}
        {isEditing && (
          <Surface style={styles.editBanner} elevation={1}>
            <Text style={styles.editBannerText}>✏️ Editing Existing Record</Text>
            <Button
              mode="outlined"
              compact
              onPress={cancelEdit}
              labelStyle={{ fontSize: 12, color: '#E65100' }}
              style={{ borderColor: '#FFE0B2' }}
            >
              Cancel
            </Button>
          </Surface>
        )}

        {/* ── Section: Party & Vehicle ── */}
        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Party & Vehicle</Text>

          {/* Party Name with autocomplete */}
          <View style={{ position: 'relative', zIndex: 10 }}>
            <TextInput
              mode="outlined"
              label="Party Name *"
              value={partyName}
              onChangeText={handlePartyChange}
              onFocus={() => {
                if (partySuggestions.length > 0) setShowPartySuggestions(true);
              }}
              style={styles.input}
              outlineStyle={styles.inputOutline}
            />
            {showPartySuggestions && partySuggestions.length > 0 && (
              <Surface style={styles.suggestionsBox} elevation={4}>
                <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 150 }}>
                  {partySuggestions.map((item, idx) => (
                    <React.Fragment key={idx}>
                      <List.Item
                        title={item}
                        onPress={() => {
                          setPartyName(item);
                          setShowPartySuggestions(false);
                        }}
                        style={{ paddingVertical: 3 }}
                      />
                      {idx < partySuggestions.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </ScrollView>
              </Surface>
            )}
          </View>

          <TextInput
            mode="outlined"
            label="Vehicle Number *"
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
            autoCapitalize="characters"
            style={[styles.input, { marginTop: 10 }]}
            outlineStyle={styles.inputOutline}
          />
        </Surface>

        {/* ── Section: Weigher & Slip ── */}
        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Weigher & Slip</Text>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Menu
                visible={weigherMenuVisible}
                onDismiss={() => setWeigherMenuVisible(false)}
                anchor={
                  <TextInput
                    mode="outlined"
                    label="Weigher *"
                    value={weigher}
                    editable={false}
                    right={<TextInput.Icon icon="chevron-down" onPress={() => setWeigherMenuVisible(true)} />}
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                    onPressIn={() => setWeigherMenuVisible(true)}
                  />
                }
              >
                {WEIGHERS.map(w => (
                  <Menu.Item
                    key={w}
                    onPress={() => { setWeigher(w); setWeigherMenuVisible(false); }}
                    title={w}
                    leadingIcon={w === weigher ? 'check' : undefined}
                  />
                ))}
              </Menu>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput
                mode="outlined"
                label="Slip Number *"
                value={slipNumber}
                onChangeText={setSlipNumber}
                keyboardType="numeric"
                editable={weigher !== 'Manual'}
                style={styles.input}
                outlineStyle={styles.inputOutline}
              />
            </View>
          </View>

          {slipDisplayNo ? (
            <Text style={styles.slipPreview}>
              Slip: <Text style={{ fontWeight: 'bold' }}>{slipDisplayNo}</Text>
            </Text>
          ) : null}

          {/* Check existing button */}
          <Button
            mode="outlined"
            onPress={handleCheckExisting}
            loading={isChecking}
            disabled={isChecking || !slipNumber}
            icon={({ size, color }) => <Search size={size} color={color} />}
            style={styles.checkButton}
            labelStyle={{ fontSize: 13 }}
          >
            Check if record exists
          </Button>
        </Surface>

        {/* ── Section: Product ── */}
        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Coffee Item</Text>

          {type === 'Arrival' ? (
            /* Arrival — predefined products + other */
            <>
              <SegmentedButtons
                value={DEFAULT_ARRIVAL_PRODUCTS.includes(productName) ? productName : 'Other'}
                onValueChange={val => {
                  if (val !== 'Other') {
                    setProductName(val);
                  } else {
                    if (DEFAULT_ARRIVAL_PRODUCTS.includes(productName)) {
                      setProductName('');
                    }
                    setProductMenuVisible(true);
                  }
                }}
                buttons={[
                  ...DEFAULT_ARRIVAL_PRODUCTS.map(p => ({ value: p, label: p })),
                  { value: 'Other', label: 'Other' },
                ]}
                style={{ marginBottom: 8 }}
              />
              {(!DEFAULT_ARRIVAL_PRODUCTS.includes(productName) || productName === '') && (
                <View style={{ marginTop: 8 }}>
                  <Menu
                    visible={productMenuVisible}
                    onDismiss={() => setProductMenuVisible(false)}
                    anchor={
                      <TextInput
                        mode="outlined"
                        label="Select Custom Product *"
                        value={DEFAULT_ARRIVAL_PRODUCTS.includes(productName) ? '' : productName}
                        editable={false}
                        right={<TextInput.Icon icon="chevron-down" onPress={() => setProductMenuVisible(true)} />}
                        style={styles.input}
                        outlineStyle={styles.inputOutline}
                        onPressIn={() => setProductMenuVisible(true)}
                      />
                    }
                    style={{ width: width * 0.85 }}
                  >
                    {nonDefaultProducts.length > 0 ? (
                      nonDefaultProducts.map(p => (
                        <Menu.Item
                          key={p}
                          onPress={() => {
                            setProductName(p);
                            setProductMenuVisible(false);
                          }}
                          title={p}
                          leadingIcon={p === productName ? 'check' : undefined}
                        />
                      ))
                    ) : (
                      <Menu.Item title="No custom products available" disabled />
                    )}
                  </Menu>
                </View>
              )}
            </>
          ) : (
            /* Dispatch — all products from DB dropdown */
            <View>
              <Menu
                visible={productMenuVisible}
                onDismiss={() => setProductMenuVisible(false)}
                anchor={
                  <TextInput
                    mode="outlined"
                    label="Select Product *"
                    value={productName}
                    editable={false}
                    right={<TextInput.Icon icon="chevron-down" onPress={() => setProductMenuVisible(true)} />}
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                    onPressIn={() => setProductMenuVisible(true)}
                  />
                }
                style={{ width: width * 0.85 }}
              >
                {allProducts.length > 0 ? (
                  allProducts.map(p => (
                    <Menu.Item
                      key={p}
                      onPress={() => {
                        setProductName(p);
                        setProductMenuVisible(false);
                      }}
                      title={p}
                      leadingIcon={p === productName ? 'check' : undefined}
                    />
                  ))
                ) : (
                  <Menu.Item title="No products in database" disabled />
                )}
              </Menu>
            </View>
          )}
        </Surface>

        {/* ── Section: Weights ── */}
        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Weight Details</Text>
          <View style={styles.row}>
            <TextInput mode="outlined" label="Gross Weight *" value={grossWeight} onChangeText={setGrossWeight} keyboardType="decimal-pad" style={[styles.input, { flex: 2 }]} right={<TextInput.Affix text="kg" />} outlineStyle={styles.inputOutline} />
            <TextInput mode="outlined" label="Bags *" value={bags} onChangeText={setBags} keyboardType="numeric" style={[styles.input, { flex: 1 }]} outlineStyle={styles.inputOutline} />
            <TextInput mode="outlined" label="Bag Tare *" value={bagWeight} onChangeText={setBagWeight} keyboardType="decimal-pad" style={[styles.input, { flex: 1.2 }]} right={<TextInput.Affix text="kg" />} outlineStyle={styles.inputOutline} />
          </View>

          {/* Auto calculated: Total Net Weight */}
          <Surface style={styles.calcBox} elevation={0}>
            <Text style={styles.calcLabel}>Total Net Weight</Text>
            <Text style={styles.calcValue}>{totalWeight.toFixed(2)} kg</Text>
          </Surface>

          <TextInput
            mode="outlined"
            label="Deduction"
            value={deduction}
            onChangeText={setDeduction}
            keyboardType="decimal-pad"
            style={[styles.input, { marginTop: 10 }]}
            right={<TextInput.Affix text="kg" />}
            outlineStyle={styles.inputOutline}
          />

          {/* Auto calculated: Net Weight */}
          <Surface style={styles.calcBox} elevation={0}>
            <Text style={styles.calcLabel}>Net Weight (after deduction)</Text>
            <Text style={styles.calcValue}>{netWeight.toFixed(2)} kg</Text>
          </Surface>
        </Surface>

        {/* ── Section: Quality ── */}
        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Quality & Output</Text>
          <View style={styles.row}>
            <TextInput mode="outlined" label="Outturn *" value={outturn} onChangeText={setOutturn} keyboardType="decimal-pad" style={[styles.input, styles.halfInput]} right={<TextInput.Affix text="%" />} outlineStyle={styles.inputOutline} />
            <TextInput mode="outlined" label="Moisture *" value={moisture} onChangeText={setMoisture} keyboardType="decimal-pad" style={[styles.input, styles.halfInput]} right={<TextInput.Affix text="%" />} outlineStyle={styles.inputOutline} />
          </View>

          {/* Auto calculated: End Product */}
          <Surface style={[styles.calcBox, { backgroundColor: '#E8F5E9', borderColor: '#81C784' }]} elevation={0}>
            <Text style={[styles.calcLabel, { color: '#2E7D32' }]}>End Product (EP)</Text>
            <Text style={[styles.calcValue, { color: '#2E7D32', fontSize: 24 }]}>{endProduct.toFixed(2)} kg</Text>
          </Surface>
        </Surface>

        {/* ── Save Button ── */}
        <Button
          mode="contained"
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving}
          style={[styles.saveButton, isEditing && { backgroundColor: '#F5A623' }]}
          contentStyle={{ height: 60 }}
          icon={({ size, color }) => <Save size={size} color={color} />}
          labelStyle={{ fontSize: 17, fontWeight: 'bold' }}
        >
          {isSaving ? 'Saving...' : isEditing ? 'Update & Share Report' : `Save & Share ${type} Report`}
        </Button>
      </ScrollView>

      {/* ── Hidden Report View for capture ── */}
      {showReport && (
        <View style={styles.hiddenReport}>
          <ReportView ref={reportRef} data={currentTxData} slipNo={slipDisplayNo || slipNumber} />
        </View>
      )}

      {/* Duplicate Dialog */}
      <Portal>
        <Dialog visible={duplicateDialogVisible} onDismiss={() => setDuplicateDialogVisible(false)}>
          <Dialog.Title>Record Found</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              A record with Weigher "{weigher}" and Slip Number "{slipNumber}" already exists.
              {'\n\n'}Do you want to edit it?
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDuplicateDialogVisible(false)}>No</Button>
            <Button onPress={handleEditConfirm}>Yes, Edit</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ backgroundColor: snackbarColor }}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 14,
    paddingBottom: 50,
    backgroundColor: '#F0F4F8',
  },
  editBanner: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  editBannerText: {
    color: '#E65100',
    fontWeight: 'bold',
    fontSize: 14,
  },
  section: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2c3e50',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 6,
  },
  input: {
    backgroundColor: '#FAFAFA',
  },
  inputOutline: {
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  halfInput: {
    flex: 0.48,
    marginBottom: 8,
  },
  thirdInput: {
    flex: 1,
  },
  slipPreview: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 6,
    textAlign: 'right',
  },
  checkButton: {
    marginTop: 10,
    borderRadius: 8,
    borderColor: '#BDC3C7',
  },
  selectedProductText: {
    fontSize: 13,
    color: '#2c3e50',
    marginTop: 6,
  },
  suggestionsBox: {
    position: 'absolute',
    top: 58,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxHeight: 180,
  },
  calcBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  calcLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1565C0',
  },
  calcValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1565C0',
  },
  saveButton: {
    borderRadius: 12,
    marginTop: 8,
    elevation: 4,
    backgroundColor: '#2c3e50',
  },
  hiddenReport: {
    position: 'absolute',
    left: -9999,
    top: 0,
  },
});

export default ReportFormScreen;
